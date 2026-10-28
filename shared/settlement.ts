import { formatMoney } from './money';
import type { Expense } from './schemas/expense';
import type { Settlement } from './schemas/settlement';
import type { Participant } from './schemas/trip';

export interface ParticipantBalance {
  participantId: string;
  name: string;
  totalPaidMinor: number;
  totalOwedMinor: number;
  netBalanceMinor: number; // totalPaid - totalOwed (> 0 means is owed money, < 0 means owes money)
}

export interface SettlementTransfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amountMinor: number;
}

/**
 * Calculates net balances for all participants based on active expenses and recorded settlements.
 */
export function calculateBalances(
  participants: Participant[],
  expenses: Expense[],
  settlements: Settlement[] = []
): ParticipantBalance[] {
  const map = new Map<string, { paid: number; owed: number }>();

  // Initialize all participants with 0
  for (const p of participants) {
    map.set(p.id, { paid: 0, owed: 0 });
  }

  // Factor in active expenses (exclude soft-deleted ones)
  for (const exp of expenses) {
    if (exp.deletedAt) continue;

    // The person who paid
    const payer = map.get(exp.paidBy);
    if (payer) {
      payer.paid += exp.amountMinor;
    }

    // The people who share the cost
    for (const share of exp.split.shares) {
      const debtor = map.get(share.participantId);
      if (debtor) {
        debtor.owed += share.amountMinor;
      }
    }
  }

  // Factor in settlement payments (A paid B ₹X)
  // When A pays B: A has paid extra (+paid), B has received repayment (+owed)
  for (const s of settlements) {
    const fromP = map.get(s.from);
    if (fromP) {
      fromP.paid += s.amountMinor;
    }
    const toP = map.get(s.to);
    if (toP) {
      toP.owed += s.amountMinor;
    }
  }

  return participants.map((p) => {
    const data = map.get(p.id) ?? { paid: 0, owed: 0 };
    return {
      participantId: p.id,
      name: p.name,
      totalPaidMinor: data.paid,
      totalOwedMinor: data.owed,
      netBalanceMinor: data.paid - data.owed,
    };
  });
}

/**
 * Computes the minimal set of transfers using the greedy creditor/debtor matching algorithm.
 * Guarantees at most N - 1 transfers.
 */
export function computeSettlementTransfers(
  balances: ParticipantBalance[]
): SettlementTransfer[] {
  // Deep clone to avoid mutating input
  interface Node {
    id: string;
    name: string;
    net: number;
  }

  const creditors: Node[] = [];
  const debtors: Node[] = [];

  for (const b of balances) {
    if (b.netBalanceMinor > 0) {
      creditors.push({ id: b.participantId, name: b.name, net: b.netBalanceMinor });
    } else if (b.netBalanceMinor < 0) {
      debtors.push({ id: b.participantId, name: b.name, net: b.netBalanceMinor });
    }
  }

  // Sort descending by magnitude: largest debtors and creditors first
  creditors.sort((a, b) => b.net - a.net);
  debtors.sort((a, b) => a.net - b.net); // most negative first

  const transfers: SettlementTransfer[] = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];
    if (!creditor || !debtor) break;

    const owedByDebtor = -debtor.net;
    const amountToTransfer = Math.min(owedByDebtor, creditor.net);

    if (amountToTransfer > 0) {
      transfers.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amountMinor: amountToTransfer,
      });

      debtor.net += amountToTransfer;
      creditor.net -= amountToTransfer;
    }

    if (debtor.net === 0) {
      dIdx++;
    }
    if (creditor.net === 0) {
      cIdx++;
    }
  }

  return transfers;
}

/**
 * Generates a clean, friendly text summary to copy or share directly to WhatsApp.
 */
export function generateWhatsAppSummary(
  tripName: string,
  currency: string,
  transfers: SettlementTransfer[],
  totalSpendMinor: number
): string {
  const formattedTotal = formatMoney(totalSpendMinor, currency);
  const lines: string[] = [
    `🏖️ *${tripName} — Expense Summary*`,
    `Total Trip Spend: ${formattedTotal}`,
    '',
  ];

  if (transfers.length === 0) {
    lines.push('🎉 Everyone is all settled up! No pending payments.');
  } else {
    lines.push('🤝 *Payments to Settle Up:*');
    for (const t of transfers) {
      const formattedAmount = formatMoney(t.amountMinor, currency);
      lines.push(`• ${t.fromName} owes ${t.toName}: ${formattedAmount}`);
    }
    lines.push('');
    lines.push('Shared via Tripsplit');
  }

  return lines.join('\n');
}

/**
 * Generates an optional UPI deep-link URL (upi://pay?...)
 */
export function generateUpiDeepLink(options: {
  pa: string; // UPI ID (VPA)
  pn: string; // Payee Name
  amountMinor: number;
  note?: string;
}): string {
  const units = (options.amountMinor / 100).toFixed(2);
  const params = new URLSearchParams({
    pa: options.pa,
    pn: options.pn,
    am: units,
    cu: 'INR',
  });
  if (options.note) {
    params.set('tn', options.note);
  }
  return `upi://pay?${params.toString()}`;
}
