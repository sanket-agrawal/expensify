<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  Share2,
  HandCoins,
  CheckCircle2,
  Copy,
  ExternalLink,
  Plus,
  History,
  QrCode,
} from 'lucide-vue-next';
import { useTripStore } from '@/stores/tripStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useCurrentUser } from '@/composables/useCurrentUser';
import { useToast } from '@/composables/useToast';
import { generateWhatsAppSummary, generateUpiDeepLink, type SettlementTransfer } from '@shared/settlement';
import { parseMoneyInput } from '@shared/money';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import MoneyText from '@/components/ui/MoneyText.vue';
import Avatar from '@/components/ui/Avatar.vue';
import BottomSheet from '@/components/ui/BottomSheet.vue';
import Skeleton from '@/components/ui/Skeleton.vue';

const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const expenseStore = useExpenseStore();
const { currentUser } = useCurrentUser();
const { success: toastSuccess, error: toastError } = useToast();

const token = computed(() => (route.params.token as string) || '');
const trip = computed(() => tripStore.currentTrip);
const currency = computed(() => trip.value?.currency || 'INR');
const isLoading = ref(true);

// Manual settlement recording modal state
const showRecordModal = ref(false);
const recordFrom = ref('');
const recordTo = ref('');
const recordAmountInput = ref('');
const recordNotes = ref('');
const isSubmitting = ref(false);

// UPI Modal state
const activeUpiTransfer = ref<SettlementTransfer | null>(null);
const upiIdInput = ref('');

onMounted(async () => {
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

const transfers = computed(() => {
  if (!trip.value) return [];
  return expenseStore.getTransfers(trip.value.participants);
});

// Mark a specific minimal transfer as paid
async function markTransferAsPaid(t: SettlementTransfer) {
  if (!token.value) return;
  try {
    await expenseStore.recordSettlement(
      token.value,
      {
        from: t.fromId,
        to: t.toId,
        amountMinor: t.amountMinor,
        date: new Date().toISOString().slice(0, 10),
        notes: 'Settled via Tripsplit',
      },
      currentUser.value?.id
    );
    toastSuccess(`Payment of ₹${t.amountMinor / 100} from ${t.fromName} to ${t.toName} marked as paid!`);
  } catch (err) {
    toastError((err as Error).message || 'Failed to record settlement');
  }
}

// Manual custom payment record
async function handleRecordPayment() {
  if (!recordFrom.value || !recordTo.value) {
    toastError('Please select both sender and receiver');
    return;
  }
  if (recordFrom.value === recordTo.value) {
    toastError('Sender and receiver cannot be the same person');
    return;
  }
  const minor = parseMoneyInput(recordAmountInput.value);
  if (minor <= 0) {
    toastError('Please enter an amount greater than zero');
    return;
  }

  isSubmitting.value = true;
  try {
    await expenseStore.recordSettlement(
      token.value,
      {
        from: recordFrom.value,
        to: recordTo.value,
        amountMinor: minor,
        date: new Date().toISOString().slice(0, 10),
        notes: recordNotes.value.trim(),
      },
      currentUser.value?.id
    );
    toastSuccess('Payment recorded successfully');
    showRecordModal.value = false;
    recordAmountInput.value = '';
    recordNotes.value = '';
  } catch (err) {
    toastError((err as Error).message || 'Failed to record payment');
  } finally {
    isSubmitting.value = false;
  }
}

function openUpiModal(t: SettlementTransfer) {
  activeUpiTransfer.value = t;
  upiIdInput.value = '';
}

function openUpiDeepLink() {
  if (!activeUpiTransfer.value) return;
  const link = generateUpiDeepLink({
    pa: upiIdInput.value.trim() || 'friend@upi',
    pn: activeUpiTransfer.value.toName,
    amountMinor: activeUpiTransfer.value.amountMinor,
    note: `${trip.value?.name || 'Trip'} settlement`,
  });

  window.open(link, '_blank');
}

// WhatsApp summary generation and copying
function copyWhatsAppSummary() {
  if (!trip.value) return;
  const summary = generateWhatsAppSummary(
    trip.value.name,
    currency.value,
    transfers.value,
    expenseStore.totalSpendMinor
  );

  navigator.clipboard.writeText(summary);
  toastSuccess('Summary copied! Paste directly into WhatsApp.');
}

function shareDirectToWhatsApp() {
  if (!trip.value) return;
  const summary = generateWhatsAppSummary(
    trip.value.name,
    currency.value,
    transfers.value,
    expenseStore.totalSpendMinor
  );

  const encoded = encodeURIComponent(summary);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

function goBack() {
  router.push(`/t/${token.value}`);
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-6 pb-28 sm:pb-16 space-y-5">
    <!-- Header Navigation -->
    <div class="flex items-center justify-between">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        Dashboard
      </button>

      <!-- WhatsApp Share Actions -->
      <div class="flex items-center gap-2">
        <Button variant="secondary" size="sm" @click="copyWhatsAppSummary">
          <template #prefix>
            <Copy class="w-3.5 h-3.5" />
          </template>
          Copy text
        </Button>
        <Button variant="seafoam" size="sm" @click="shareDirectToWhatsApp">
          <template #prefix>
            <Share2 class="w-3.5 h-3.5" />
          </template>
          WhatsApp
        </Button>
      </div>
    </div>

    <div>
      <h1 class="font-display text-2xl font-bold text-ink flex items-center gap-2">
        <HandCoins class="w-6 h-6 text-lagoon" />
        Settle up
      </h1>
      <p class="text-xs text-ink-muted">
        Minimal payments calculated using greedy creditor-debtor balancing
      </p>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-3">
      <Skeleton height="h-28" radius="md" />
      <Skeleton height="h-28" radius="md" />
    </div>

    <!-- Content -->
    <div v-else-if="trip" class="space-y-6">
      <!-- Section 1: Minimal Transfers Needed -->
      <div class="space-y-3">
        <div class="flex items-center justify-between px-1">
          <h2 class="font-display text-lg font-semibold text-ink">
            Payments needed
          </h2>
          <span class="text-xs text-ink-muted">
            {{ transfers.length }} {{ transfers.length === 1 ? 'transfer' : 'transfers' }}
          </span>
        </div>

        <!-- If transfers exist -->
        <div v-if="transfers.length > 0" class="space-y-3">
          <Card
            v-for="(t, idx) in transfers"
            :key="`${t.fromId}-${t.toId}-${idx}`"
            padding="md"
            class="space-y-3.5 border border-sand-200/80 dark:border-white/5"
          >
            <!-- From -> To Visual Flow -->
            <div class="flex items-center justify-between">
              <!-- Debtor (Payer) -->
              <div class="flex items-center gap-2.5 min-w-0">
                <Avatar :name="t.fromName" size="sm" />
                <div class="min-w-0">
                  <span class="text-sm font-semibold text-ink truncate block">
                    {{ t.fromName }}
                  </span>
                  <span class="text-[11px] text-coral font-medium">owes</span>
                </div>
              </div>

              <!-- Amount Pill in center -->
              <div class="px-3 py-1 rounded-chip bg-sand-100 dark:bg-white/10 font-bold text-ink">
                <MoneyText :amount-minor="t.amountMinor" :currency="currency" size="sm" />
              </div>

              <!-- Creditor (Receiver) -->
              <div class="flex items-center gap-2.5 min-w-0 text-right justify-end">
                <div class="min-w-0">
                  <span class="text-sm font-semibold text-ink truncate block">
                    {{ t.toName }}
                  </span>
                  <span class="text-[11px] text-lagoon font-medium">receives</span>
                </div>
                <Avatar :name="t.toName" size="sm" />
              </div>
            </div>

            <!-- Action buttons for this transfer -->
            <div class="flex items-center gap-2 pt-2 border-t border-sand-200/60 dark:border-white/5">
              <Button
                variant="primary"
                size="sm"
                block
                @click="markTransferAsPaid(t)"
              >
                <template #prefix>
                  <CheckCircle2 class="w-4 h-4 stroke-[2.5]" />
                </template>
                Mark as paid
              </Button>

              <Button
                v-if="currency === 'INR'"
                variant="secondary"
                size="sm"
                @click="openUpiModal(t)"
              >
                <template #prefix>
                  <QrCode class="w-4 h-4" />
                </template>
                UPI pay
              </Button>
            </div>
          </Card>
        </div>

        <!-- All Settled Celebration Card -->
        <Card v-else padding="lg" class="text-center py-10 space-y-3">
          <div class="w-14 h-14 rounded-full bg-seafoam/30 text-2xl flex items-center justify-center mx-auto select-none">
            🏖️
          </div>
          <h2 class="font-display text-lg font-semibold text-ink">
            Everyone is all settled up!
          </h2>
          <p class="text-xs text-ink-muted max-w-xs mx-auto">
            No outstanding balances between anyone in {{ trip.name }}.
          </p>
        </Card>
      </div>

      <!-- Action to manually record a payment -->
      <div class="flex justify-center pt-1">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-lagoon hover:underline"
          @click="showRecordModal = true"
        >
          <Plus class="w-4 h-4" />
          Record a custom payment (e.g. cash or partial transfer)
        </button>
      </div>

      <!-- Section 2: Settlement Payment History -->
      <div v-if="expenseStore.settlements.length > 0" class="space-y-3 pt-2">
        <div class="flex items-center justify-between px-1">
          <h2 class="font-display text-base font-semibold text-ink flex items-center gap-2">
            <History class="w-4 h-4 text-ink-muted" />
            Payment history
          </h2>
          <span class="text-xs text-ink-muted">
            {{ expenseStore.settlements.length }} recorded
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="s in expenseStore.settlements"
            :key="s._id"
            class="flex items-center justify-between p-3 rounded-btn bg-card border border-sand-200/60 dark:border-white/5 text-xs shadow-soft"
          >
            <div class="flex items-center gap-2 min-w-0">
              <CheckCircle2 class="w-4 h-4 text-seafoam-dark shrink-0" />
              <span class="text-ink truncate">
                <strong>{{ tripStore.getParticipant(s.from)?.name || 'Friend' }}</strong>
                paid
                <strong>{{ tripStore.getParticipant(s.to)?.name || 'Friend' }}</strong>
              </span>
            </div>

            <div class="text-right shrink-0 font-semibold text-ink">
              <MoneyText :amount-minor="s.amountMinor" :currency="currency" size="xs" />
              <span class="block text-[10px] text-ink-muted font-normal">{{ s.date }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Record Custom Payment Bottom Sheet -->
    <BottomSheet
      v-if="trip"
      v-model:open="showRecordModal"
      title="Record a payment"
      description="Log a repayment made outside of Tripsplit"
    >
      <form class="space-y-4 py-2" @submit.prevent="handleRecordPayment">
        <!-- From -->
        <div>
          <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
            Who paid?
          </label>
          <select
            v-model="recordFrom"
            required
            class="w-full px-3 py-2.5 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-lagoon"
          >
            <option value="" disabled>Select payer</option>
            <option
              v-for="p in trip.participants"
              :key="p.id"
              :value="p.id"
            >
              {{ p.name }}
            </option>
          </select>
        </div>

        <!-- To -->
        <div>
          <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
            To whom?
          </label>
          <select
            v-model="recordTo"
            required
            class="w-full px-3 py-2.5 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-lagoon"
          >
            <option value="" disabled>Select receiver</option>
            <option
              v-for="p in trip.participants"
              :key="p.id"
              :value="p.id"
              :disabled="p.id === recordFrom"
            >
              {{ p.name }}
            </option>
          </select>
        </div>

        <!-- Amount -->
        <div>
          <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
            Amount ({{ currency === 'INR' ? '₹' : currency }})
          </label>
          <input
            v-model="recordAmountInput"
            type="text"
            inputmode="decimal"
            placeholder="0.00"
            required
            class="w-full px-3 py-2.5 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-lg font-bold tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-lagoon font-display"
          />
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
            Notes (optional)
          </label>
          <input
            v-model="recordNotes"
            type="text"
            placeholder="e.g. GPay transfer, Cash at checkout..."
            class="w-full px-3 py-2.5 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-lagoon"
          />
        </div>

        <div class="pt-2">
          <Button
            type="submit"
            variant="primary"
            block
            size="lg"
            :loading="isSubmitting"
          >
            Record payment
          </Button>
        </div>
      </form>
    </BottomSheet>

    <!-- UPI Deep Link Helper Sheet -->
    <BottomSheet
      v-if="activeUpiTransfer"
      :open="!!activeUpiTransfer"
      title="Pay with UPI"
      description="Launch your UPI payment app (GPay, PhonePe, Paytm)"
      @close="activeUpiTransfer = null"
    >
      <div class="space-y-4 py-2">
        <div class="p-3 bg-sand-100 dark:bg-white/5 rounded-btn text-xs space-y-1">
          <div class="flex justify-between">
            <span class="text-ink-muted">Paying to:</span>
            <span class="font-bold text-ink">{{ activeUpiTransfer.toName }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-muted">Amount:</span>
            <span class="font-bold text-lagoon">
              <MoneyText :amount-minor="activeUpiTransfer.amountMinor" currency="INR" size="sm" />
            </span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
            Enter recipient's UPI ID (optional)
          </label>
          <input
            v-model="upiIdInput"
            type="text"
            placeholder="e.g. rahul@okaxis, 9876543210@paytm"
            class="w-full px-3 py-2.5 bg-sand-100 dark:bg-white/5 rounded-btn border border-sand-200 dark:border-white/10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-lagoon"
          />
        </div>

        <Button
          variant="primary"
          block
          size="lg"
          @click="openUpiDeepLink"
        >
          <template #prefix>
            <ExternalLink class="w-4 h-4" />
          </template>
          Open UPI app
        </Button>
      </div>
    </BottomSheet>
  </div>
</template>
