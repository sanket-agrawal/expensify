import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Expense, CreateExpenseInput, UpdateExpenseInput, CategoryKey } from '@shared/schemas/expense';
import type { Settlement, CreateSettlementInput } from '@shared/schemas/settlement';
import type { Participant } from '@shared/schemas/trip';
import { calculateBalances, computeSettlementTransfers, type ParticipantBalance, type SettlementTransfer } from '@shared/settlement';
import { apiClient } from '@/lib/apiClient';

export interface CategorySpendSummary {
  categoryKey: CategoryKey;
  amountMinor: number;
  percentage: number;
  count: number;
}

export const useExpenseStore = defineStore('expense', () => {
  const expenses = ref<Expense[]>([]);
  const settlements = ref<Settlement[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll(token: string) {
    loading.value = true;
    error.value = null;
    try {
      const [expRes, setRes] = await Promise.all([
        apiClient.getExpenses(token),
        apiClient.getSettlements(token),
      ]);
      expenses.value = expRes.expenses;
      settlements.value = setRes.settlements;
    } catch (err) {
      error.value = (err as Error).message || 'Failed to load expenses';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createExpense(
    token: string,
    input: CreateExpenseInput,
    actorId?: string
  ): Promise<Expense> {
    const res = await apiClient.createExpense(token, input, actorId);
    expenses.value = [res.expense, ...expenses.value];
    return res.expense;
  }

  async function updateExpense(
    token: string,
    id: string,
    input: UpdateExpenseInput,
    actorId?: string
  ): Promise<Expense> {
    const res = await apiClient.updateExpense(token, id, input, actorId);
    expenses.value = expenses.value.map((e) => (e._id === id ? res.expense : e));
    return res.expense;
  }

  async function deleteExpense(
    token: string,
    id: string,
    actorId?: string
  ): Promise<Expense | undefined> {
    const target = expenses.value.find((e) => e._id === id);
    await apiClient.deleteExpense(token, id, actorId);
    expenses.value = expenses.value.filter((e) => e._id !== id);
    return target;
  }

  // Undo soft-delete: re-creates the expense
  async function restoreExpense(
    token: string,
    cached: Expense,
    actorId?: string
  ): Promise<void> {
    const res = await apiClient.createExpense(
      token,
      {
        title: cached.title,
        amountMinor: cached.amountMinor,
        date: cached.date,
        categoryKey: cached.categoryKey,
        paidBy: cached.paidBy,
        split: cached.split,
        notes: cached.notes,
        photos: cached.photos,
      },
      actorId
    );
    expenses.value = [res.expense, ...expenses.value];
  }

  async function recordSettlement(
    token: string,
    input: CreateSettlementInput,
    actorId?: string
  ): Promise<Settlement> {
    const res = await apiClient.createSettlement(token, input, actorId);
    settlements.value = [res.settlement, ...settlements.value];
    return res.settlement;
  }

  function getExpense(id: string): Expense | undefined {
    return expenses.value.find((e) => e._id === id);
  }

  const totalSpendMinor = computed(() => {
    return expenses.value.reduce((sum, e) => sum + e.amountMinor, 0);
  });

  function getBalances(participants: Participant[]): ParticipantBalance[] {
    return calculateBalances(participants, expenses.value, settlements.value);
  }

  function getTransfers(participants: Participant[]): SettlementTransfer[] {
    const balances = getBalances(participants);
    return computeSettlementTransfers(balances);
  }

  const categoryBreakdown = computed((): CategorySpendSummary[] => {
    const total = totalSpendMinor.value;
    if (total === 0) return [];

    const map = new Map<CategoryKey, { amountMinor: number; count: number }>();
    for (const exp of expenses.value) {
      const existing = map.get(exp.categoryKey) ?? { amountMinor: 0, count: 0 };
      existing.amountMinor += exp.amountMinor;
      existing.count += 1;
      map.set(exp.categoryKey, existing);
    }

    const result: CategorySpendSummary[] = [];
    for (const [categoryKey, data] of map.entries()) {
      result.push({
        categoryKey,
        amountMinor: data.amountMinor,
        percentage: Math.round((data.amountMinor / total) * 100),
        count: data.count,
      });
    }

    // Sort descending by highest spend
    return result.sort((a, b) => b.amountMinor - a.amountMinor);
  });

  return {
    expenses,
    settlements,
    loading,
    error,
    fetchAll,
    createExpense,
    updateExpense,
    deleteExpense,
    restoreExpense,
    recordSettlement,
    getExpense,
    totalSpendMinor,
    getBalances,
    getTransfers,
    categoryBreakdown,
  };
});
