<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus, ReceiptText, HandCoins, Share2, AlertCircle } from 'lucide-vue-next';
import { useTripStore } from '@/stores/tripStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useCurrentUser } from '@/composables/useCurrentUser';
import { useToast } from '@/composables/useToast';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import MoneyText from '@/components/ui/MoneyText.vue';
import Avatar from '@/components/ui/Avatar.vue';
import Skeleton from '@/components/ui/Skeleton.vue';
import HeroDivider from '@/components/layout/HeroDivider.vue';
import ParticipantPickerModal from '@/components/trip/ParticipantPickerModal.vue';
import CategoryBreakdown from '@/components/trip/CategoryBreakdown.vue';
import ExpenseRow from '@/components/expense/ExpenseRow.vue';
import type { Expense } from '@shared/schemas/expense';

const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const expenseStore = useExpenseStore();
const { currentUser, initUserForTrip } = useCurrentUser();
const { success: toastSuccess } = useToast();

const token = computed(() => (route.params.token as string) || '');
const showPicker = ref(false);
const isLoading = ref(true);

const trip = computed(() => tripStore.currentTrip);
const currency = computed(() => trip.value?.currency || 'INR');

const balances = computed(() => {
  if (!trip.value) return [];
  return expenseStore.getBalances(trip.value.participants);
});

const userBalance = computed(() => {
  if (!currentUser.value) return null;
  return balances.value.find((b) => b.participantId === currentUser.value?.id) ?? null;
});

const recentExpenses = computed(() => {
  return expenseStore.expenses.slice(0, 5);
});

async function loadData() {
  if (!token.value) return;
  isLoading.value = true;
  try {
    initUserForTrip(token.value);
    const fetchedTrip = await tripStore.fetchTrip(token.value);
    await expenseStore.fetchAll(token.value);

    // Prompt participant picker if not chosen yet on this device
    if (!currentUser.value && fetchedTrip.participants.length > 0) {
      showPicker.value = true;
    }
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadData();
});

function goToAddExpense() {
  router.push(`/t/${token.value}/expenses/new`);
}

function goToExpenses() {
  router.push(`/t/${token.value}/expenses`);
}

function goToSettle() {
  router.push(`/t/${token.value}/settle`);
}

function onExpenseClick(expense: Expense) {
  router.push(`/t/${token.value}/expenses/${expense._id}`);
}

function copyTripLink() {
  const url = window.location.href;
  navigator.clipboard.writeText(url);
  toastSuccess('Trip link copied to clipboard!');
}
</script>

<template>
  <div class="pb-24 sm:pb-12">
    <!-- Loading skeleton -->
    <div v-if="isLoading && !trip" class="max-w-xl mx-auto px-4 py-8 space-y-4">
      <Skeleton height="h-44" radius="lg" />
      <Skeleton height="h-28" radius="md" />
      <Skeleton height="h-36" radius="md" />
    </div>

    <!-- Error state / trip not found -->
    <div v-else-if="tripStore.error && !trip" class="max-w-md mx-auto px-4 py-16 text-center space-y-4">
      <div class="w-12 h-12 rounded-full bg-coral/20 text-coral flex items-center justify-center mx-auto">
        <AlertCircle class="w-6 h-6" />
      </div>
      <h2 class="font-display text-xl font-bold text-ink">
        Trip not found
      </h2>
      <p class="text-xs text-ink-muted">
        The link may be invalid or expired. Check with your travel group.
      </p>
      <Button variant="secondary" size="sm" @click="router.push('/')">
        Go to home
      </Button>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="trip">
      <!-- Hero Section with Golden-hour/Deep sea gradient & Wavy Divider -->
      <section class="bg-gradient-to-b from-deep-sea via-[#134956] to-deep-sea text-white pt-6 pb-2 px-4 sm:px-6 relative shadow-soft">
        <div class="max-w-xl mx-auto space-y-4">
          <!-- Top bar with emoji & share -->
          <div class="flex items-center justify-between text-xs text-white/80">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip bg-white/10 font-medium select-none">
              {{ trip.emoji }} {{ trip.name }}
            </span>
            <button
              type="button"
              class="flex items-center gap-1 px-2.5 py-1 rounded-chip bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              title="Share trip link"
              @click="copyTripLink"
            >
              <Share2 class="w-3.5 h-3.5" />
              <span>Share link</span>
            </button>
          </div>

          <!-- Total Spent & User Balance Card -->
          <div class="py-2 text-center">
            <p class="text-xs uppercase tracking-wider text-white/70 font-medium mb-1">
              Total group spend
            </p>
            <div class="text-white">
              <MoneyText
                :amount-minor="expenseStore.totalSpendMinor"
                :currency="currency"
                size="hero"
                display-font
              />
            </div>

            <!-- Balance summary pill -->
            <div
              class="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-chip backdrop-blur-sm text-sm cursor-pointer select-none transition-transform hover:scale-102"
              :class="
                !userBalance || userBalance.netBalanceMinor === 0
                  ? 'bg-white/10 text-white'
                  : userBalance.netBalanceMinor > 0
                  ? 'bg-seafoam/25 text-seafoam border border-seafoam/30'
                  : 'bg-coral/25 text-coral border border-coral/30'
              "
              @click="showPicker = true"
            >
              <span class="opacity-90">
                {{ currentUser ? `${currentUser.name}:` : 'Your balance:' }}
              </span>
              <span v-if="!currentUser" class="font-semibold underline">
                Select who you are
              </span>
              <span v-else-if="userBalance && userBalance.netBalanceMinor > 0" class="font-bold">
                You are owed <MoneyText :amount-minor="userBalance.netBalanceMinor" :currency="currency" size="sm" />
              </span>
              <span v-else-if="userBalance && userBalance.netBalanceMinor < 0" class="font-bold">
                You owe <MoneyText :amount-minor="Math.abs(userBalance.netBalanceMinor)" :currency="currency" size="sm" />
              </span>
              <span v-else class="font-semibold">
                All settled up
              </span>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <Button variant="seafoam" block @click="goToAddExpense">
              <template #prefix>
                <Plus class="w-4 h-4 stroke-[2.5]" />
              </template>
              Add expense
            </Button>
            <Button
              variant="secondary"
              block
              class="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
              @click="goToSettle"
            >
              <template #prefix>
                <HandCoins class="w-4 h-4" />
              </template>
              Settle up
            </Button>
          </div>
        </div>
      </section>

      <!-- Wavy divider connecting hero to sand page -->
      <HeroDivider />

      <!-- Main Content Area -->
      <main class="max-w-xl mx-auto px-4 mt-4 space-y-6">
        <!-- Participant balances breakdown -->
        <section class="space-y-3">
          <div class="flex items-center justify-between px-1">
            <h2 class="font-display text-lg font-semibold text-ink">
              Group balances
            </h2>
            <button
              type="button"
              class="text-xs font-semibold text-lagoon hover:underline"
              @click="showPicker = true"
            >
              Switch person
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Card
              v-for="b in balances"
              :key="b.participantId"
              padding="sm"
              class="flex items-center justify-between sm:flex-col sm:items-start sm:gap-2"
              :class="currentUser?.id === b.participantId ? 'ring-2 ring-lagoon/40' : ''"
            >
              <div class="flex items-center gap-2 min-w-0">
                <Avatar :name="b.name" size="sm" />
                <span class="font-medium text-sm text-ink truncate">
                  {{ b.name }}
                  <span v-if="currentUser?.id === b.participantId" class="text-[11px] text-lagoon ml-0.5">(You)</span>
                </span>
              </div>

              <div class="text-right sm:text-left">
                <span
                  v-if="b.netBalanceMinor > 0"
                  class="text-xs font-semibold text-lagoon"
                >
                  +<MoneyText :amount-minor="b.netBalanceMinor" :currency="currency" size="xs" />
                </span>
                <span
                  v-else-if="b.netBalanceMinor < 0"
                  class="text-xs font-semibold text-coral"
                >
                  -<MoneyText :amount-minor="Math.abs(b.netBalanceMinor)" :currency="currency" size="xs" />
                </span>
                <span v-else class="text-xs text-ink-muted font-medium">
                  Settled
                </span>
              </div>
            </Card>
          </div>
        </section>

        <!-- Category breakdown -->
        <CategoryBreakdown
          :breakdown="expenseStore.categoryBreakdown"
          :currency="currency"
        />

        <!-- Recent Expenses Section -->
        <section class="space-y-3">
          <div class="flex items-center justify-between px-1">
            <h2 class="font-display text-lg font-semibold text-ink flex items-center gap-2">
              <ReceiptText class="w-4.5 h-4.5 text-deep-sea dark:text-sky" />
              Recent expenses
            </h2>
            <button
              v-if="expenseStore.expenses.length > 0"
              type="button"
              class="text-xs font-semibold text-lagoon hover:underline"
              @click="goToExpenses"
            >
              View all ({{ expenseStore.expenses.length }})
            </button>
          </div>

          <div v-if="recentExpenses.length > 0" class="space-y-2">
            <ExpenseRow
              v-for="exp in recentExpenses"
              :key="exp._id"
              :expense="exp"
              :currency="currency"
              :current-participant-id="currentUser?.id"
              :payer-name="tripStore.getParticipant(exp.paidBy)?.name"
              @click="onExpenseClick"
            />
          </div>

          <Card v-else padding="lg" class="text-center py-8">
            <p class="text-sm text-ink-muted mb-3">
              No bills recorded yet. Add the first dinner, cab or stay!
            </p>
            <Button variant="primary" size="sm" @click="goToAddExpense">
              Add first expense
            </Button>
          </Card>
        </section>
      </main>
    </div>

    <!-- Participant Picker Modal ("Who are you?") -->
    <ParticipantPickerModal
      v-if="trip"
      v-model:open="showPicker"
      :participants="trip.participants"
    />
  </div>
</template>
