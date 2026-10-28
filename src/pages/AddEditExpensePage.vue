<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Sparkles, ChevronRight, Calendar } from 'lucide-vue-next';
import { useTripStore } from '@/stores/tripStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useCurrentUser } from '@/composables/useCurrentUser';
import { useToast } from '@/composables/useToast';
import { detectCategory, CATEGORIES, type CategoryDefinition } from '@/lib/categoryMatcher';
import { parseMoneyInput } from '@shared/money';
import { compressImage } from '@/lib/imageCompress';
import { apiClient } from '@/lib/apiClient';
import type { CategoryKey, SplitMode, SplitShare, PhotoAttachment } from '@shared/schemas/expense';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import IconChip from '@/components/ui/IconChip.vue';
import BottomSheet from '@/components/ui/BottomSheet.vue';
import SplitSharesEditor from '@/components/expense/SplitSharesEditor.vue';
import PhotoGrid, { type PhotoItem } from '@/components/ui/PhotoGrid.vue';

const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const expenseStore = useExpenseStore();
const { currentUser } = useCurrentUser();
const { success: toastSuccess, error: toastError } = useToast();

const token = computed(() => (route.params.token as string) || '');
const expenseId = computed(() => (route.params.id as string) || '');
const isEditing = computed(() => !!expenseId.value);

const trip = computed(() => tripStore.currentTrip);
const currency = computed(() => trip.value?.currency || 'INR');

// Form State
const title = ref('');
const amountInput = ref('');
const date = ref(new Date().toISOString().slice(0, 10));
const notes = ref('');
const paidBy = ref<string>('');

// Category State
const detectedCategory = ref<CategoryDefinition>(CATEGORIES.misc);
const manualCategoryKey = ref<CategoryKey | null>(null);
const showCategoryPicker = ref(false);

const activeCategory = computed(() => {
  if (manualCategoryKey.value) {
    return CATEGORIES[manualCategoryKey.value] || CATEGORIES.misc;
  }
  return detectedCategory.value;
});

// Split State
const splitMode = ref<SplitMode>('equal');
const splitShares = ref<SplitShare[]>([]);
const isSplitValid = ref(true);

// Photos State
const photos = ref<PhotoItem[]>([]);
const isSubmitting = ref(false);

// Auto-detect category as user types title
watch(title, (newTitle) => {
  if (!manualCategoryKey.value) {
    detectedCategory.value = detectCategory(newTitle);
  }
});

const amountMinor = computed(() => {
  return parseMoneyInput(amountInput.value);
});

onMounted(async () => {
  if (!trip.value && token.value) {
    await tripStore.fetchTrip(token.value);
  }

  // Set default payer to current user or first participant
  if (currentUser.value?.id) {
    paidBy.value = currentUser.value.id;
  } else if (trip.value?.participants[0]) {
    paidBy.value = trip.value.participants[0].id;
  }

  // If editing, load existing expense
  if (isEditing.value) {
    let exp = expenseStore.getExpense(expenseId.value);
    if (!exp && token.value) {
      await expenseStore.fetchAll(token.value);
      exp = expenseStore.getExpense(expenseId.value);
    }
    if (exp) {
      title.value = exp.title;
      amountInput.value = (exp.amountMinor / 100).toString();
      date.value = exp.date;
      notes.value = exp.notes || '';
      paidBy.value = exp.paidBy;
      manualCategoryKey.value = exp.categoryKey;
      splitMode.value = exp.split.mode;
      splitShares.value = exp.split.shares;

      // Existing photos
      photos.value = exp.photos.map((p) => ({
        id: Math.random().toString(36).substring(2),
        previewUrl: p.thumbnailUrl || p.objectKey, // will resolve signed GET if needed
        objectKey: p.objectKey,
        status: 'done',
        progress: 100,
      }));
    }
  }
});

function onSplitUpdate(val: { mode: SplitMode; shares: SplitShare[]; isValid: boolean }) {
  splitMode.value = val.mode;
  splitShares.value = val.shares;
  isSplitValid.value = val.isValid;
}

function selectCategory(catKey: CategoryKey) {
  manualCategoryKey.value = catKey;
  showCategoryPicker.value = false;
}

function resetCategoryAuto() {
  manualCategoryKey.value = null;
  detectedCategory.value = detectCategory(title.value);
  showCategoryPicker.value = false;
}

// Multi-photo upload with client compression & direct GCS signed PUT
async function handlePhotosAdd(fileList: FileList | File[]) {
  const files = Array.from(fileList);

  for (const rawFile of files) {
    const photoId = Math.random().toString(36).substring(2);
    const localPreview = URL.createObjectURL(rawFile);

    const item: PhotoItem = {
      id: photoId,
      previewUrl: localPreview,
      status: 'pending',
      progress: 0,
      file: rawFile,
    };
    photos.value.push(item);

    // Upload asynchronously
    uploadSinglePhoto(item);
  }
}

async function uploadSinglePhoto(item: PhotoItem) {
  if (!item.file || !token.value) return;

  item.status = 'uploading';
  item.progress = 10;

  try {
    // 1. Client-side compress image (<1600px, JPEG ~0.8)
    const compressed = await compressImage(item.file);
    item.progress = 30;

    // 2. Request V4 signed PUT URL from serverless endpoint
    const { uploadUrl, objectKey } = await apiClient.getUploadSignedUrl(token.value, {
      filename: compressed.file.name,
      contentType: 'image/jpeg',
      size: compressed.compressedSizeBytes,
    });
    item.progress = 50;

    // 3. Upload directly from browser to GCS via PUT URL
    await apiClient.uploadDirectToGcs(
      uploadUrl,
      compressed.blob,
      'image/jpeg',
      (pct) => {
        // Map upload progress 50% -> 95%
        item.progress = 50 + Math.round((pct * 45) / 100);
      }
    );

    item.objectKey = objectKey;
    item.status = 'done';
    item.progress = 100;
  } catch (err) {
    console.error('Photo upload failed:', err);
    item.status = 'error';
    item.errorMessage = (err as Error).message || 'Upload failed';
    toastError(`Photo upload failed: ${item.errorMessage}`);
  }
}

function handlePhotoRemove(photoId: string) {
  photos.value = photos.value.filter((p) => p.id !== photoId);
}

function handlePhotoRetry(photoId: string) {
  const item = photos.value.find((p) => p.id === photoId);
  if (item) {
    uploadSinglePhoto(item);
  }
}

async function handleSubmit() {
  if (!title.value.trim()) {
    toastError('Please enter what this bill is for');
    return;
  }

  if (amountMinor.value <= 0) {
    toastError('Please enter an amount greater than zero');
    return;
  }

  if (!paidBy.value) {
    toastError('Please select who paid for this expense');
    return;
  }

  if (!isSplitValid.value || splitShares.value.length === 0) {
    toastError('Please check your split shares before saving');
    return;
  }

  // Check if any photo is currently uploading
  if (photos.value.some((p) => p.status === 'uploading')) {
    toastError('Please wait for photos to finish uploading');
    return;
  }

  isSubmitting.value = true;
  try {
    const photoAttachments: PhotoAttachment[] = photos.value
      .filter((p) => p.status === 'done' && p.objectKey)
      .map((p) => ({
        objectKey: p.objectKey!,
        contentType: 'image/jpeg',
        size: p.file?.size || 1024,
      }));

    if (isEditing.value) {
      await expenseStore.updateExpense(
        token.value,
        expenseId.value,
        {
          title: title.value.trim(),
          amountMinor: amountMinor.value,
          date: date.value,
          categoryKey: activeCategory.value.key,
          paidBy: paidBy.value,
          split: {
            mode: splitMode.value,
            shares: splitShares.value,
          },
          notes: notes.value.trim(),
          photos: photoAttachments,
        },
        currentUser.value?.id
      );
      toastSuccess('Expense updated');
    } else {
      await expenseStore.createExpense(
        token.value,
        {
          title: title.value.trim(),
          amountMinor: amountMinor.value,
          date: date.value,
          categoryKey: activeCategory.value.key,
          paidBy: paidBy.value,
          split: {
            mode: splitMode.value,
            shares: splitShares.value,
          },
          notes: notes.value.trim(),
          photos: photoAttachments,
        },
        currentUser.value?.id
      );
      toastSuccess('Expense saved');
    }

    router.push(`/t/${token.value}`);
  } catch (err) {
    toastError((err as Error).message || 'Failed to save expense');
  } finally {
    isSubmitting.value = false;
  }
}

function goBack() {
  router.push(`/t/${token.value}`);
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-6 pb-28 sm:pb-16 space-y-4">
    <!-- Top Cancel navigation -->
    <div class="flex items-center justify-between">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        Cancel
      </button>

      <!-- Animated Detected Category Chip -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-90 translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
      >
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-xs font-semibold shadow-soft transition-all active:scale-95"
          :class="manualCategoryKey ? 'ring-2 ring-lagoon ring-offset-1 ring-offset-sand' : ''"
          @click="showCategoryPicker = true"
        >
          <IconChip :color="activeCategory.color" size="sm">
            <template #icon>
              <component :is="activeCategory.icon" class="w-3.5 h-3.5" />
            </template>
          </IconChip>
          <span class="text-ink font-medium">{{ activeCategory.label }}</span>
          <ChevronRight class="w-3.5 h-3.5 text-ink-muted ml-0.5" />
        </button>
      </Transition>
    </div>

    <div>
      <h1 class="font-display text-2xl font-bold text-ink">
        {{ isEditing ? 'Edit expense' : 'Add an expense' }}
      </h1>
      <p class="text-xs text-ink-muted">Enter bill details, who paid, and who shared</p>
    </div>

    <form @submit.prevent="handleSubmit">
      <Card padding="lg" class="space-y-5">
        <!-- Title & Live Category Matcher -->
        <div>
          <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            What was this for?
          </label>
          <div class="relative">
            <input
              v-model="title"
              type="text"
              placeholder="e.g. Seafood dinner, Goa homestay, Petrol, Uber..."
              required
              autofocus
              class="w-full px-4 py-3 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-lagoon font-medium"
            />
          </div>
        </div>

        <!-- Rupee Amount Input -->
        <div>
          <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            Amount ({{ currency === 'INR' ? '₹' : currency }})
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 font-display text-2xl font-bold text-ink-muted select-none">
              {{ currency === 'INR' ? '₹' : currency }}
            </span>
            <input
              v-model="amountInput"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              required
              class="w-full pl-10 pr-4 py-3 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-2xl font-bold tabular-nums text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-lagoon font-display"
            />
          </div>
        </div>

        <!-- Date & Paid By Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Date -->
          <div>
            <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Date
            </label>
            <div class="relative">
              <Calendar class="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="date"
                type="date"
                required
                class="w-full pl-9 pr-3 py-2.5 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-lagoon"
              />
            </div>
          </div>

          <!-- Paid By Picker -->
          <div v-if="trip">
            <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Paid by
            </label>
            <select
              v-model="paidBy"
              required
              class="w-full px-3 py-2.5 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-lagoon"
            >
              <option
                v-for="p in trip.participants"
                :key="p.id"
                :value="p.id"
              >
                {{ p.name }} {{ currentUser?.id === p.id ? '(You)' : '' }}
              </option>
            </select>
          </div>
        </div>

        <!-- Split Shares Editor -->
        <div v-if="trip" class="pt-2 border-t border-sand-200/60 dark:border-white/10">
          <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
            Split the cost
          </label>
          <SplitSharesEditor
            :participants="trip.participants"
            :total-amount-minor="amountMinor"
            :currency="currency"
            :initial-mode="splitMode"
            :initial-shares="splitShares"
            @update:split="onSplitUpdate"
          />
        </div>

        <!-- Bill Photos Upload & Lightbox -->
        <div class="pt-2 border-t border-sand-200/60 dark:border-white/10">
          <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
            Bill & Receipt photos
          </label>
          <PhotoGrid
            :photos="photos"
            :editable="true"
            @add="handlePhotosAdd"
            @remove="handlePhotoRemove"
            @retry="handlePhotoRetry"
          />
        </div>

        <!-- Optional Notes -->
        <div>
          <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            Notes (optional)
          </label>
          <textarea
            v-model="notes"
            rows="2"
            placeholder="e.g. Split with tip included, Rahul gave cash..."
            class="w-full px-3 py-2 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-lagoon resize-none"
          />
        </div>

        <!-- Save Button -->
        <div class="pt-2">
          <Button
            type="submit"
            variant="primary"
            block
            size="lg"
            :loading="isSubmitting"
            :disabled="!isSplitValid || amountMinor <= 0 || !title.trim()"
          >
            {{ isEditing ? 'Update expense' : 'Save expense' }}
          </Button>
        </div>
      </Card>
    </form>

    <!-- Category Override Picker Bottom Sheet -->
    <BottomSheet
      v-model:open="showCategoryPicker"
      title="Choose category"
      description="Select the category that best matches this bill"
    >
      <div class="space-y-3 py-2">
        <button
          v-if="manualCategoryKey"
          type="button"
          class="w-full text-xs font-semibold text-lagoon p-2 rounded-btn bg-lagoon/10 hover:bg-lagoon/20 transition-colors flex items-center justify-center gap-1.5"
          @click="resetCategoryAuto"
        >
          <Sparkles class="w-3.5 h-3.5" />
          Reset to auto-detected category
        </button>

        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="cat in Object.values(CATEGORIES)"
            :key="cat.key"
            type="button"
            class="flex items-center gap-2 p-2.5 rounded-btn text-left transition-all active:scale-95 border"
            :class="
              activeCategory.key === cat.key
                ? 'bg-card border-lagoon shadow-soft font-semibold'
                : 'bg-sand-100/60 dark:bg-white/5 border-transparent hover:bg-sand-200/60'
            "
            @click="selectCategory(cat.key)"
          >
            <IconChip :color="cat.color" size="sm">
              <template #icon>
                <component :is="cat.icon" class="w-4 h-4 shrink-0" />
              </template>
            </IconChip>
            <span class="text-xs text-ink truncate">{{ cat.label }}</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
