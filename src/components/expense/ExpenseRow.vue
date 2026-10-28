<script setup lang="ts">
import { computed } from 'vue';
import type { Expense } from '@shared/schemas/expense';
import { CATEGORIES } from '@/lib/categoryMatcher';
import IconChip from '@/components/ui/IconChip.vue';
import MoneyText from '@/components/ui/MoneyText.vue';
import { Camera } from 'lucide-vue-next';

interface Props {
  expense: Expense;
  currency?: string;
  currentParticipantId?: string;
  payerName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currency: 'INR',
  currentParticipantId: '',
  payerName: '',
});

const emit = defineEmits<{
  (e: 'click', expense: Expense): void;
}>();

const category = computed(() => {
  return CATEGORIES[props.expense.categoryKey] || CATEGORIES.misc;
});

const isPayer = computed(() => {
  return props.currentParticipantId && props.expense.paidBy === props.currentParticipantId;
});

const userShare = computed(() => {
  if (!props.currentParticipantId) return null;
  const share = props.expense.split.shares.find(
    (s) => s.participantId === props.currentParticipantId
  );
  return share ? share.amountMinor : null;
});

const netUserImpact = computed(() => {
  if (!props.currentParticipantId) return null;
  const share = userShare.value ?? 0;
  if (isPayer.value) {
    // Paid total, owes their share => net lent to group: total - share
    return props.expense.amountMinor - share;
  }
  // Not payer, owes their share => -share
  return share > 0 ? -share : 0;
});
</script>

<template>
  <div
    class="flex items-center justify-between p-3.5 bg-card hover:bg-sand-50 dark:hover:bg-card-elevated rounded-btn border border-sand-200/60 dark:border-white/5 shadow-soft transition-all duration-150 cursor-pointer active:scale-[0.99]"
    role="button"
    tabindex="0"
    @click="emit('click', expense)"
    @keydown.enter="emit('click', expense)"
  >
    <!-- Left: Category Icon + Title + Payer -->
    <div class="flex items-center gap-3 min-w-0 mr-3">
      <IconChip :color="category.color" size="md">
        <template #icon>
          <component :is="category.icon" class="w-4.5 h-4.5 shrink-0" />
        </template>
      </IconChip>

      <div class="min-w-0">
        <div class="flex items-center gap-1.5">
          <h4 class="font-medium text-sm text-ink truncate">
            {{ expense.title }}
          </h4>
          <span
            v-if="expense.photos && expense.photos.length > 0"
            class="text-ink-muted inline-flex items-center"
            :title="`${expense.photos.length} receipt photo(s)`"
          >
            <Camera class="w-3.5 h-3.5" />
          </span>
        </div>
        <p class="text-xs text-ink-muted truncate mt-0.5">
          <span class="font-medium">{{ isPayer ? 'You' : payerName || 'Someone' }}</span> paid
        </p>
      </div>
    </div>

    <!-- Right: Total Amount & Your Share -->
    <div class="text-right shrink-0">
      <div class="font-semibold">
        <MoneyText :amount-minor="expense.amountMinor" :currency="currency" size="sm" />
      </div>

      <div v-if="currentParticipantId" class="text-xs mt-0.5">
        <span
          v-if="isPayer && (netUserImpact ?? 0) > 0"
          class="text-lagoon font-medium"
        >
          lent <MoneyText :amount-minor="netUserImpact!" :currency="currency" size="xs" />
        </span>
        <span
          v-else-if="userShare && userShare > 0"
          class="text-coral font-medium"
        >
          your share <MoneyText :amount-minor="userShare" :currency="currency" size="xs" />
        </span>
        <span v-else class="text-ink-muted text-[11px]">
          not involved
        </span>
      </div>
    </div>
  </div>
</template>
