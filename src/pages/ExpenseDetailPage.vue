<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Edit3, Trash2, Calendar, FileText, ExternalLink } from 'lucide-vue-next';
import { useTripStore } from '@/stores/tripStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useCurrentUser } from '@/composables/useCurrentUser';
import { useToast } from '@/composables/useToast';
import { CATEGORIES } from '@/lib/categoryMatcher';
import { apiClient } from '@/lib/apiClient';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import IconChip from '@/components/ui/IconChip.vue';
import MoneyText from '@/components/ui/MoneyText.vue';
import Avatar from '@/components/ui/Avatar.vue';
import Lightbox from '@/components/ui/Lightbox.vue';

const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const expenseStore = useExpenseStore();
const { currentUser } = useCurrentUser();
const { success: toastSuccess, error: toastError } = useToast();

const token = computed(() => (route.params.token as string) || '');
const expenseId = computed(() => (route.params.id as string) || '');

const trip = computed(() => tripStore.currentTrip);
const currency = computed(() => trip.value?.currency || 'INR');
const expense = computed(() => expenseStore.getExpense(expenseId.value));

const category = computed(() => {
  if (!expense.value) return CATEGORIES.misc;
  return CATEGORIES[expense.value.categoryKey] || CATEGORIES.misc;
});

const payer = computed(() => {
  if (!expense.value) return null;
  return tripStore.getParticipant(expense.value.paidBy);
});

// Signed photo URLs for private viewing
const resolvedPhotoUrls = ref<Record<string, string>>({});
const activeLightboxUrl = ref<string | null>(null);
const isDeleting = ref(false);

onMounted(async () => {
  if (!trip.value && token.value) {
    await tripStore.fetchTrip(token.value);
  }
  if (!expense.value && token.value) {
    await expenseStore.fetchAll(token.value);
  }

  // Resolve signed GET URLs for any private photos
  if (expense.value?.photos && token.value) {
    for (const p of expense.value.photos) {
      try {
        const { url } = await apiClient.getPhotoSignedUrl(token.value, p.objectKey);
        resolvedPhotoUrls.value[p.objectKey] = url;
      } catch (err) {
        console.error('Failed to resolve photo URL:', err);
      }
    }
  }
});

function goBack() {
  router.push(`/t/${token.value}/expenses`);
}

function editExpense() {
  router.push(`/t/${token.value}/expenses/${expenseId.value}/edit`);
}

async function handleDelete() {
  if (!confirm('Are you sure you want to delete this expense?')) return;

  isDeleting.value = true;
  try {
    const deletedCached = await expenseStore.deleteExpense(
      token.value,
      expenseId.value,
      currentUser.value?.id
    );

    // Toast with Undo action
    toastSuccess('Expense deleted', {
      label: 'Undo',
      onClick: async () => {
        if (deletedCached) {
          await expenseStore.restoreExpense(token.value, deletedCached, currentUser.value?.id);
          toastSuccess('Expense restored');
        }
      },
    });

    router.push(`/t/${token.value}/expenses`);
  } catch (err) {
    toastError((err as Error).message || 'Failed to delete expense');
  } finally {
    isDeleting.value = false;
  }
}

function isPdfPhoto(photo: { contentType?: string; objectKey: string }): boolean {
  return photo.contentType === 'application/pdf' || photo.objectKey.toLowerCase().endsWith('.pdf');
}

function handlePhotoClick(photo: { contentType?: string; objectKey: string }) {
  const url = resolvedPhotoUrls.value[photo.objectKey];
  if (!url) return;
  if (isPdfPhoto(photo)) {
    window.open(url, '_blank');
  } else {
    activeLightboxUrl.value = url;
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-6 pb-28 sm:pb-16 space-y-4">
    <!-- Top Back Navigation & Actions -->
    <div class="flex items-center justify-between">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        Expenses
      </button>

      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" @click="editExpense">
          <template #prefix>
            <Edit3 class="w-4 h-4" />
          </template>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="!text-coral hover:!bg-coral/10"
          :loading="isDeleting"
          @click="handleDelete"
        >
          <template #prefix>
            <Trash2 class="w-4 h-4" />
          </template>
          Delete
        </Button>
      </div>
    </div>

    <!-- Main Detail Card -->
    <div v-if="expense" class="space-y-4">
      <Card padding="lg" class="space-y-4 text-center">
        <!-- Category Icon Chip -->
        <div class="flex justify-center">
          <IconChip :color="category.color" size="lg">
            <template #icon>
              <component :is="category.icon" class="w-6 h-6" />
            </template>
          </IconChip>
        </div>

        <div>
          <h1 class="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            {{ expense.title }}
          </h1>
          <p class="text-xs text-ink-muted mt-1 flex items-center justify-center gap-1.5">
            <Calendar class="w-3.5 h-3.5" />
            <span>{{ expense.date }}</span>
          </p>
        </div>

        <!-- Big Amount Text -->
        <div class="py-2">
          <MoneyText
            :amount-minor="expense.amountMinor"
            :currency="currency"
            size="hero"
            display-font
          />
        </div>

        <!-- Payer Banner -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-chip bg-sand-100 dark:bg-white/5 border border-sand-200/80 dark:border-white/10 text-xs">
          <Avatar
            v-if="payer"
            :name="payer.name"
            :color-key="payer.colorKey"
            size="sm"
          />
          <span class="text-ink">
            Paid by <strong class="font-semibold">{{ payer?.name || 'Someone' }}</strong>
          </span>
        </div>
      </Card>

      <!-- Split Breakdown Card -->
      <Card padding="md" class="space-y-3">
        <div class="flex items-center justify-between border-b border-sand-200/60 dark:border-white/5 pb-2">
          <h3 class="font-display font-semibold text-base text-ink">
            Split breakdown
          </h3>
          <span class="text-xs text-ink-muted capitalize">
            Mode: {{ expense.split.mode }}
          </span>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="share in expense.split.shares"
            :key="share.participantId"
            class="flex items-center justify-between p-2 rounded-btn bg-sand-100/50 dark:bg-white/5"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <Avatar
                :name="tripStore.getParticipant(share.participantId)?.name || '?'"
                :color-key="tripStore.getParticipant(share.participantId)?.colorKey"
                size="sm"
              />
              <span class="text-sm font-medium text-ink truncate">
                {{ tripStore.getParticipant(share.participantId)?.name || 'Friend' }}
                <span
                  v-if="currentUser?.id === share.participantId"
                  class="text-[11px] text-lagoon font-semibold ml-0.5"
                >
                  (You)
                </span>
              </span>
            </div>

            <div class="text-right">
              <span class="text-sm font-bold text-ink">
                <MoneyText :amount-minor="share.amountMinor" :currency="currency" size="sm" />
              </span>
              <span v-if="share.percentage" class="text-[11px] text-ink-muted ml-1">
                ({{ share.percentage }}%)
              </span>
            </div>
          </div>
        </div>
      </Card>

      <!-- Bill Attachments Gallery -->
      <Card v-if="expense.photos && expense.photos.length > 0" padding="md" class="space-y-3">
        <h3 class="font-display font-semibold text-base text-ink">
          Receipts & Bills ({{ expense.photos.length }})
        </h3>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            v-for="photo in expense.photos"
            :key="photo.objectKey"
            class="aspect-square rounded-btn overflow-hidden bg-sand-200/50 dark:bg-white/5 border border-sand-200 dark:border-white/10 cursor-pointer hover:scale-102 transition-transform duration-150 flex flex-col justify-center items-center"
            @click="handlePhotoClick(photo)"
          >
            <!-- PDF Document -->
            <div
              v-if="isPdfPhoto(photo)"
              class="w-full h-full flex flex-col items-center justify-center p-3 bg-coral/10 text-coral hover:bg-coral/15 transition-colors text-center"
            >
              <FileText class="w-8 h-8 mb-1.5" />
              <span class="text-xs font-semibold text-ink line-clamp-2">PDF Document</span>
              <span class="text-[10px] text-coral font-bold flex items-center gap-1 mt-1 bg-coral/20 px-2 py-0.5 rounded">
                <ExternalLink class="w-3 h-3" /> View PDF
              </span>
            </div>

            <!-- Image Photo -->
            <img
              v-else-if="resolvedPhotoUrls[photo.objectKey]"
              :src="resolvedPhotoUrls[photo.objectKey]"
              alt="Receipt photo"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-xs text-ink-muted animate-pulse">
              Loading...
            </div>
          </div>
        </div>
      </Card>

      <!-- Notes Card if any -->
      <Card v-if="expense.notes" padding="md" class="space-y-1.5">
        <h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider">
          Notes
        </h3>
        <p class="text-sm text-ink leading-relaxed whitespace-pre-wrap">
          {{ expense.notes }}
        </p>
      </Card>
    </div>

    <!-- Lightbox for viewing photos -->
    <Lightbox
      :open="!!activeLightboxUrl"
      :image-url="activeLightboxUrl || ''"
      title="Bill Receipt"
      @close="activeLightboxUrl = null"
    />
  </div>
</template>
