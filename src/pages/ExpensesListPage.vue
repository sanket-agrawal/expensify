<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus, Search, Filter, X } from 'lucide-vue-next';
import { useTripStore } from '@/stores/tripStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useCurrentUser } from '@/composables/useCurrentUser';
import { CATEGORIES } from '@/lib/categoryMatcher';
import Button from '@/components/ui/Button.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ExpenseRow from '@/components/expense/ExpenseRow.vue';
import Skeleton from '@/components/ui/Skeleton.vue';
import MoneyText from '@/components/ui/MoneyText.vue';
import type { Expense, CategoryKey } from '@shared/schemas/expense';

const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const expenseStore = useExpenseStore();
const { currentUser, initUserForTrip } = useCurrentUser();

const token = computed(() => (route.params.token as string) || '');
const trip = computed(() => tripStore.currentTrip);
const currency = computed(() => trip.value?.currency || 'INR');

const searchQuery = ref('');
const selectedCategory = ref<CategoryKey | 'all'>('all');
const selectedParticipantId = ref<string | 'all'>('all');
const isLoading = ref(true);

onMounted(async () => {
  if (token.value) {
    initUserForTrip(token.value);
  }
  if (!trip.value && token.value) {
    await tripStore.fetchTrip(token.value);
  }
  if (token.value) {
    try {
      await expenseStore.fetchAll(token.value);
    } finally {
      isLoading.value = false;
    }
  }
});

// Categories that actually exist in the current expenses
const availableCategories = computed(() => {
  const set = new Set(expenseStore.expenses.map((e) => e.categoryKey));
  return Array.from(set);
});

// Filtered expenses
const filteredExpenses = computed(() => {
  return expenseStore.expenses.filter((e) => {
    // Search query match
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchNote = e.notes?.toLowerCase().includes(q);
      if (!matchTitle && !matchNote) return false;
    }

    // Category filter
    if (selectedCategory.value !== 'all' && e.categoryKey !== selectedCategory.value) {
      return false;
    }

    // Participant filter (either payer or sharer)
    if (selectedParticipantId.value !== 'all') {
      const isPayer = e.paidBy === selectedParticipantId.value;
      const isSharer = e.split.shares.some((s) => s.participantId === selectedParticipantId.value);
      if (!isPayer && !isSharer) return false;
    }

    return true;
  });
});

// Group filtered expenses by date
interface DateGroup {
  dateKey: string;
  displayDate: string;
  expenses: Expense[];
  totalMinor: number;
}

const groupedExpenses = computed((): DateGroup[] => {
  const groups: Record<string, Expense[]> = {};

  for (const exp of filteredExpenses.value) {
    const d = exp.date;
    if (!groups[d]) {
      groups[d] = [];
    }
    groups[d]!.push(exp);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return sortedDates.map((dateKey) => {
    let displayDate: string;
    if (dateKey === todayStr) {
      displayDate = 'Today';
    } else if (dateKey === yesterdayStr) {
      displayDate = 'Yesterday';
    } else {
      const parsed = new Date(dateKey + 'T00:00:00');
      displayDate = parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      });
    }

    const items = groups[dateKey] || [];
    const totalMinor = items.reduce((sum, item) => sum + item.amountMinor, 0);

    return {
      dateKey,
      displayDate,
      expenses: items,
      totalMinor,
    };
  });
});

function goToAddExpense() {
  router.push(`/t/${token.value}/expenses/new`);
}

function onExpenseClick(expense: Expense) {
  router.push(`/t/${token.value}/expenses/${expense._id}`);
}

function clearFilters() {
  searchQuery.value = '';
  selectedCategory.value = 'all';
  selectedParticipantId.value = 'all';
}
</script>

<template>
  <div class="max-w-xl w-full mx-auto px-4 py-6 pb-28 sm:pb-16 space-y-4 min-w-0">
    <!-- Header with title & Add button -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold text-ink">
          Expenses
        </h1>
        <p class="text-xs text-ink-muted">
          {{ filteredExpenses.length }} {{ filteredExpenses.length === 1 ? 'expense' : 'expenses' }} recorded
        </p>
      </div>

      <Button variant="primary" size="sm" @click="goToAddExpense">
        <template #prefix>
          <Plus class="w-4 h-4" />
        </template>
        Add expense
      </Button>
    </div>

    <!-- Search Input -->
    <div class="relative">
      <Search class="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search expenses by title or note..."
        class="w-full pl-9 pr-8 py-2.5 bg-card rounded-btn border border-sand-200 dark:border-white/10 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-lagoon transition-all shadow-soft"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink"
        @click="searchQuery = ''"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Filters Row: Participants & Categories -->
    <div class="space-y-2 max-w-full min-w-0 overflow-hidden">
      <!-- Participant filter chips -->
      <div v-if="trip && trip.participants.length > 0" class="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full min-w-0 no-scrollbar">
        <button
          type="button"
          class="px-2.5 py-1 rounded-chip text-xs font-medium whitespace-nowrap transition-all"
          :class="
            selectedParticipantId === 'all'
              ? 'bg-ink text-sand dark:bg-white dark:text-ink font-semibold'
              : 'bg-sand-200/60 dark:bg-white/10 text-ink-muted hover:text-ink'
          "
          @click="selectedParticipantId = 'all'"
        >
          All friends
        </button>
        <button
          v-for="p in trip.participants"
          :key="p.id"
          type="button"
          class="px-2.5 py-1 rounded-chip text-xs font-medium whitespace-nowrap transition-all"
          :class="
            selectedParticipantId === p.id
              ? 'bg-lagoon text-white font-semibold shadow-soft'
              : 'bg-sand-200/60 dark:bg-white/10 text-ink-muted hover:text-ink'
          "
          @click="selectedParticipantId = p.id"
        >
          {{ p.name }} {{ currentUser?.id === p.id ? '(You)' : '' }}
        </button>
      </div>

      <!-- Category filter chips if categories exist -->
      <div v-if="availableCategories.length > 1" class="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full min-w-0 no-scrollbar">
        <button
          type="button"
          class="px-2.5 py-1 rounded-chip text-xs font-medium whitespace-nowrap transition-all"
          :class="
            selectedCategory === 'all'
              ? 'bg-deep-sea text-white dark:bg-sky/30 dark:text-sky font-semibold'
              : 'bg-sand-200/60 dark:bg-white/10 text-ink-muted hover:text-ink'
          "
          @click="selectedCategory = 'all'"
        >
          All categories
        </button>
        <button
          v-for="catKey in availableCategories"
          :key="catKey"
          type="button"
          class="px-2.5 py-1 rounded-chip text-xs font-medium whitespace-nowrap transition-all"
          :class="
            selectedCategory === catKey
              ? 'bg-deep-sea text-white dark:bg-sky/30 dark:text-sky font-semibold'
              : 'bg-sand-200/60 dark:bg-white/10 text-ink-muted hover:text-ink'
          "
          @click="selectedCategory = catKey"
        >
          {{ CATEGORIES[catKey]?.label || catKey }}
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-3 pt-2">
      <Skeleton height="h-16" radius="md" />
      <Skeleton height="h-16" radius="md" />
      <Skeleton height="h-16" radius="md" />
    </div>

    <!-- Date-grouped list -->
    <div v-else-if="groupedExpenses.length > 0" class="space-y-6 pt-1">
      <div
        v-for="group in groupedExpenses"
        :key="group.dateKey"
        class="space-y-2"
      >
        <!-- Group Date Header -->
        <div class="flex items-center justify-between px-1 text-xs font-semibold text-ink-muted uppercase tracking-wider">
          <span>{{ group.displayDate }}</span>
          <span class="text-ink font-semibold normal-case">
            <MoneyText :amount-minor="group.totalMinor" :currency="currency" size="xs" />
          </span>
        </div>

        <!-- Expenses in this group -->
        <div class="space-y-2">
          <ExpenseRow
            v-for="exp in group.expenses"
            :key="exp._id"
            :expense="exp"
            :currency="currency"
            :current-participant-id="currentUser?.id"
            :payer-name="tripStore.getParticipant(exp.paidBy)?.name"
            @click="onExpenseClick"
          />
        </div>
      </div>
    </div>

    <!-- Empty search result state -->
    <div
      v-else-if="expenseStore.expenses.length > 0 && filteredExpenses.length === 0"
      class="text-center py-12 space-y-3"
    >
      <div class="w-10 h-10 rounded-full bg-sand-200 dark:bg-white/10 flex items-center justify-center mx-auto text-ink-muted">
        <Filter class="w-5 h-5" />
      </div>
      <h3 class="font-display font-semibold text-base text-ink">
        No matching expenses
      </h3>
      <p class="text-xs text-ink-muted max-w-xs mx-auto">
        No expenses match your search query or active filters.
      </p>
      <Button variant="secondary" size="sm" @click="clearFilters">
        Reset filters
      </Button>
    </div>

    <!-- Empty trip state -->
    <EmptyState
      v-else
      title="No expenses logged yet"
      description="Add meals, tickets, hotel bills, or fuel to split the cost with everyone."
    >
      <template #action>
        <Button variant="primary" @click="goToAddExpense">
          Log first expense
        </Button>
      </template>
    </EmptyState>
  </div>
</template>
