<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Participant } from '@shared/schemas/trip';
import type { SplitMode, SplitShare } from '@shared/schemas/expense';
import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
} from '@shared/split';
import { parseMoneyInput } from '@shared/money';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import Avatar from '@/components/ui/Avatar.vue';
import MoneyText from '@/components/ui/MoneyText.vue';

interface Props {
  participants: Participant[];
  totalAmountMinor: number;
  currency?: string;
  initialMode?: SplitMode;
  initialShares?: SplitShare[];
}

const props = withDefaults(defineProps<Props>(), {
  currency: 'INR',
  initialMode: 'equal',
  initialShares: () => [],
});

const emit = defineEmits<{
  (e: 'update:split', val: { mode: SplitMode; shares: SplitShare[]; isValid: boolean }): void;
}>();

const mode = ref<SplitMode>(props.initialMode);

// Selection state for Equal mode (participant IDs)
const selectedEqualIds = ref<string[]>(
  props.initialShares.length > 0
    ? props.initialShares.map((s) => s.participantId)
    : props.participants.map((p) => p.id)
);

// Exact amounts map (participantId -> input string in rupees)
const exactInputMap = ref<Record<string, string>>({});
// Percentages map (participantId -> input number)
const percentageInputMap = ref<Record<string, number>>({});

// Initialize maps
for (const p of props.participants) {
  const existing = props.initialShares.find((s) => s.participantId === p.id);
  if (existing) {
    exactInputMap.value[p.id] = (existing.amountMinor / 100).toString();
    percentageInputMap.value[p.id] = existing.percentage ?? 0;
  } else {
    exactInputMap.value[p.id] = '';
    percentageInputMap.value[p.id] = 0;
  }
}

// Split mode options for SegmentedControl
const splitOptions = [
  { value: 'equal' as const, label: 'Split equally' },
  { value: 'exact' as const, label: 'Exact amounts' },
  { value: 'percentage' as const, label: 'By percentage' },
];

const remainderStatus = ref<{
  isValid: boolean;
  message?: string;
  remainderMinor: number;
}>({
  isValid: true,
  remainderMinor: 0,
});

function recalculate() {
  if (mode.value === 'equal') {
    const res = calculateEqualSplit(props.totalAmountMinor, selectedEqualIds.value);
    remainderStatus.value = {
      isValid: res.isValid && selectedEqualIds.value.length > 0,
      remainderMinor: res.remainderMinor,
      message: selectedEqualIds.value.length === 0 ? 'Select at least one participant' : undefined,
    };
    emit('update:split', {
      mode: 'equal',
      shares: res.shares,
      isValid: remainderStatus.value.isValid,
    });
  } else if (mode.value === 'exact') {
    const shares = props.participants
      .filter((p) => exactInputMap.value[p.id] && exactInputMap.value[p.id]?.trim() !== '')
      .map((p) => ({
        participantId: p.id,
        amountMinor: parseMoneyInput(exactInputMap.value[p.id] || '0'),
      }));

    const res = calculateExactSplit(props.totalAmountMinor, shares);
    remainderStatus.value = {
      isValid: res.isValid,
      remainderMinor: res.remainderMinor,
      message: res.errorMessage,
    };
    emit('update:split', {
      mode: 'exact',
      shares: res.shares,
      isValid: res.isValid,
    });
  } else if (mode.value === 'percentage') {
    const sharesWithPct = props.participants
      .filter((p) => (percentageInputMap.value[p.id] ?? 0) > 0)
      .map((p) => ({
        participantId: p.id,
        percentage: Number(percentageInputMap.value[p.id]) || 0,
      }));

    const res = calculatePercentageSplit(props.totalAmountMinor, sharesWithPct);
    remainderStatus.value = {
      isValid: res.isValid,
      remainderMinor: res.remainderMinor,
      message: res.errorMessage,
    };
    emit('update:split', {
      mode: 'percentage',
      shares: res.shares,
      isValid: res.isValid,
    });
  }
}

function toggleEqualParticipant(id: string) {
  if (selectedEqualIds.value.includes(id)) {
    selectedEqualIds.value = selectedEqualIds.value.filter((i) => i !== id);
  } else {
    selectedEqualIds.value.push(id);
  }
  recalculate();
}

function selectAllEqual() {
  selectedEqualIds.value = props.participants.map((p) => p.id);
  recalculate();
}

watch([() => props.totalAmountMinor, mode], () => {
  recalculate();
});
</script>

<template>
  <div class="space-y-3.5">
    <!-- Split mode selector -->
    <SegmentedControl
      v-model="mode"
      :options="splitOptions"
    />

    <!-- Equal split view -->
    <div v-if="mode === 'equal'" class="space-y-2">
      <div class="flex items-center justify-between text-xs px-1">
        <span class="text-ink-muted">Who is sharing this bill?</span>
        <button
          type="button"
          class="font-semibold text-lagoon hover:underline"
          @click="selectAllEqual"
        >
          Select all
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div
          v-for="p in participants"
          :key="p.id"
          class="flex items-center justify-between p-2.5 rounded-btn border transition-all cursor-pointer select-none"
          :class="
            selectedEqualIds.includes(p.id)
              ? 'bg-card border-lagoon/50 shadow-soft'
              : 'bg-sand-100/60 dark:bg-white/5 border-transparent opacity-60'
          "
          @click="toggleEqualParticipant(p.id)"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <input
              type="checkbox"
              :checked="selectedEqualIds.includes(p.id)"
              class="rounded text-lagoon focus:ring-lagoon pointer-events-none"
            />
            <Avatar :name="p.name" :color-key="p.colorKey" size="sm" />
            <span class="text-sm font-medium text-ink truncate">{{ p.name }}</span>
          </div>

          <div v-if="selectedEqualIds.includes(p.id) && totalAmountMinor > 0" class="text-xs font-semibold text-ink">
            <MoneyText
              :amount-minor="Math.round(totalAmountMinor / (selectedEqualIds.length || 1))"
              :currency="currency"
              size="xs"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Exact amounts view -->
    <div v-else-if="mode === 'exact'" class="space-y-2">
      <p class="text-xs text-ink-muted px-1">Enter exact rupee amount for each person:</p>
      <div class="space-y-2">
        <div
          v-for="p in participants"
          :key="p.id"
          class="flex items-center justify-between p-2 rounded-btn bg-card border border-sand-200 dark:border-white/10"
        >
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <Avatar :name="p.name" :color-key="p.colorKey" size="sm" />
            <span class="text-sm font-medium text-ink truncate">{{ p.name }}</span>
          </div>
          <div class="w-32">
            <input
              v-model="exactInputMap[p.id]"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              class="w-full text-right px-3 py-1.5 bg-sand-100 dark:bg-white/5 rounded-md text-sm font-semibold tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-lagoon"
              @input="recalculate"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Percentage view -->
    <div v-else-if="mode === 'percentage'" class="space-y-2">
      <p class="text-xs text-ink-muted px-1">Enter percentage (%) share for each person:</p>
      <div class="space-y-2">
        <div
          v-for="p in participants"
          :key="p.id"
          class="flex items-center justify-between p-2 rounded-btn bg-card border border-sand-200 dark:border-white/10"
        >
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <Avatar :name="p.name" :color-key="p.colorKey" size="sm" />
            <span class="text-sm font-medium text-ink truncate">{{ p.name }}</span>
          </div>
          <div class="w-24 relative">
            <input
              v-model.number="percentageInputMap[p.id]"
              type="number"
              min="0"
              max="100"
              step="any"
              placeholder="0"
              class="w-full text-right pr-6 pl-2 py-1.5 bg-sand-100 dark:bg-white/5 rounded-md text-sm font-semibold tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-lagoon"
              @input="recalculate"
            />
            <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted">%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Remainder indicator banner -->
    <div
      v-if="remainderStatus.message || (mode !== 'equal' && remainderStatus.remainderMinor !== 0)"
      class="p-2.5 rounded-btn text-xs font-medium flex items-center justify-between"
      :class="remainderStatus.isValid ? 'bg-seafoam/25 text-seafoam-dark' : 'bg-coral/15 text-coral'"
    >
      <span>{{ remainderStatus.message || 'Shares match total amount' }}</span>
      <span v-if="!remainderStatus.isValid && remainderStatus.remainderMinor !== 0">
        Remainder: <MoneyText :amount-minor="remainderStatus.remainderMinor" :currency="currency" size="xs" />
      </span>
    </div>
  </div>
</template>
