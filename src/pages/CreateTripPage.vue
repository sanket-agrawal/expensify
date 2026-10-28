<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-vue-next';
import { APP_CONFIG } from '@/config/app';
import { useTripStore } from '@/stores/tripStore';
import { useToast } from '@/composables/useToast';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';

const router = useRouter();
const tripStore = useTripStore();
const { error: toastError, success: toastSuccess } = useToast();

const tripName = ref('');
const tripEmoji = ref('🏖️');
const currency = ref(APP_CONFIG.defaultCurrency);
const participants = ref<string[]>(['Rahul', 'Sanket', 'Ananya']);
const isSubmitting = ref(false);

const EMOJI_OPTIONS = ['🏖️', '🌴', '⛺', '🏔️', '🍹', '🛵', '✈️', '🌊'];

function goBack() {
  router.push('/');
}

function addParticipant() {
  if (participants.value.length < APP_CONFIG.maxParticipants) {
    participants.value.push('');
  }
}

function removeParticipant(index: number) {
  if (participants.value.length > APP_CONFIG.minParticipants) {
    participants.value.splice(index, 1);
  }
}

async function handleSubmit() {
  if (!tripName.value.trim()) {
    toastError('Please enter a trip name');
    return;
  }

  const cleanedNames = participants.value.map((n) => n.trim()).filter(Boolean);
  if (cleanedNames.length < APP_CONFIG.minParticipants) {
    toastError(`Please enter at least ${APP_CONFIG.minParticipants} friends' names`);
    return;
  }

  const uniqueSet = new Set(cleanedNames.map((n) => n.toLowerCase()));
  if (uniqueSet.size !== cleanedNames.length) {
    toastError('Participant names must be unique');
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await tripStore.createTrip({
      name: tripName.value.trim(),
      emoji: tripEmoji.value,
      currency: currency.value,
      participants: cleanedNames,
    });

    toastSuccess('Trip created! Share the link with friends.');
    router.push(`/t/${res.accessToken}`);
  } catch (err) {
    toastError((err as Error).message || 'Failed to create trip');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-6 pb-24 sm:pb-12 space-y-4">
    <!-- Back Header -->
    <div class="flex items-center justify-between">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        Back
      </button>
    </div>

    <div>
      <h1 class="font-display text-2xl font-bold text-ink">
        Plan a new trip
      </h1>
      <p class="text-xs text-ink-muted">Set up your group and start logging expenses</p>
    </div>

    <form @submit.prevent="handleSubmit">
      <Card padding="lg" class="space-y-5">
        <!-- Trip Name & Emoji Selector -->
        <div>
          <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            Trip Name & Emoji
          </label>
          <div class="flex gap-2">
            <div class="relative">
              <input
                v-model="tripEmoji"
                type="text"
                maxlength="2"
                class="w-14 text-center px-2 py-3 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-2xl focus:outline-none focus:ring-2 focus:ring-lagoon"
              />
            </div>
            <input
              v-model="tripName"
              type="text"
              placeholder="e.g. Goa Trip, Manali Cabin..."
              required
              class="flex-1 px-4 py-3 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-lagoon font-medium"
            />
          </div>

          <!-- Quick Emoji Chips -->
          <div class="flex items-center gap-1.5 mt-2">
            <button
              v-for="em in EMOJI_OPTIONS"
              :key="em"
              type="button"
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all hover:scale-110 active:scale-95"
              :class="tripEmoji === em ? 'bg-lagoon/20 ring-2 ring-lagoon' : 'hover:bg-sand-200/50'"
              @click="tripEmoji = em"
            >
              {{ em }}
            </button>
          </div>
        </div>

        <!-- Currency Selector -->
        <div>
          <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            Currency
          </label>
          <select
            v-model="currency"
            class="w-full px-4 py-3 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-lagoon"
          >
            <option
              v-for="curr in APP_CONFIG.supportedCurrencies"
              :key="curr.code"
              :value="curr.code"
            >
              {{ curr.code }} ({{ curr.symbol }}) — {{ curr.label }}
            </option>
          </select>
        </div>

        <!-- Participants (2 to 10) -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Who is going?
            </label>
            <span class="text-xs text-ink-muted font-medium">
              {{ participants.length }} / {{ APP_CONFIG.maxParticipants }} friends
            </span>
          </div>

          <div class="space-y-2.5">
            <div
              v-for="(_, index) in participants"
              :key="index"
              class="flex items-center gap-2"
            >
              <input
                v-model="participants[index]"
                type="text"
                :placeholder="`Friend ${index + 1}`"
                required
                class="flex-1 px-3.5 py-2.5 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-lagoon font-medium"
              />
              <button
                v-if="participants.length > APP_CONFIG.minParticipants"
                type="button"
                class="p-2 text-ink-muted hover:text-coral transition-colors"
                title="Remove friend"
                @click="removeParticipant(index)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            v-if="participants.length < APP_CONFIG.maxParticipants"
            type="button"
            class="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-lagoon hover:underline"
            @click="addParticipant"
          >
            <Plus class="w-4 h-4" />
            Add another friend
          </button>
        </div>

        <div class="pt-4">
          <Button
            type="submit"
            variant="primary"
            block
            size="lg"
            :loading="isSubmitting"
          >
            Create trip
          </Button>
        </div>
      </Card>
    </form>
  </div>
</template>
