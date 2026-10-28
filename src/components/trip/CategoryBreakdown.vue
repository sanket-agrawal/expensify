<script setup lang="ts">
import { computed } from 'vue';
import type { CategorySpendSummary } from '@/stores/expenseStore';
import { CATEGORIES } from '@/lib/categoryMatcher';
import MoneyText from '@/components/ui/MoneyText.vue';
import Card from '@/components/ui/Card.vue';

interface Props {
  breakdown: CategorySpendSummary[];
  currency?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currency: 'INR',
});

// Pick the top 5 categories, group remainder into other if needed
const topCategories = computed(() => props.breakdown.slice(0, 5));

const PALETTE_COLORS = [
  '#1FA3A3', // lagoon
  '#FF7A59', // coral
  '#FFC857', // sunshine
  '#0E5A6B', // deep sea
  '#BFE9DD', // seafoam
  '#6B7A86', // muted
];
</script>

<template>
  <Card v-if="breakdown.length > 0" padding="md" class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-display font-semibold text-base text-ink">
        Category breakdown
      </h3>
      <span class="text-xs text-ink-muted">{{ breakdown.length }} categories</span>
    </div>

    <!-- Hand-built multi-segmented stacked horizontal bar -->
    <div class="w-full h-3.5 rounded-full overflow-hidden flex bg-sand-200/80 dark:bg-white/10 p-0.5 gap-0.5">
      <div
        v-for="(cat, idx) in topCategories"
        :key="cat.categoryKey"
        class="h-full rounded-sm transition-all duration-300"
        :style="{
          width: `${cat.percentage}%`,
          backgroundColor: PALETTE_COLORS[idx % PALETTE_COLORS.length],
        }"
        :title="`${CATEGORIES[cat.categoryKey]?.label || cat.categoryKey}: ${cat.percentage}%`"
      />
    </div>

    <!-- Legend items -->
    <div class="grid grid-cols-2 gap-2.5 pt-1">
      <div
        v-for="(cat, idx) in topCategories"
        :key="cat.categoryKey"
        class="flex items-center justify-between p-2 rounded-btn bg-sand-100/50 dark:bg-white/5 text-xs"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :style="{ backgroundColor: PALETTE_COLORS[idx % PALETTE_COLORS.length] }"
          />
          <span class="truncate font-medium text-ink">
            {{ CATEGORIES[cat.categoryKey]?.label || cat.categoryKey }}
          </span>
        </div>
        <div class="text-right shrink-0">
          <MoneyText :amount-minor="cat.amountMinor" :currency="currency" size="xs" />
          <span class="text-[10px] text-ink-muted ml-1">({{ cat.percentage }}%)</span>
        </div>
      </div>
    </div>
  </Card>
</template>
