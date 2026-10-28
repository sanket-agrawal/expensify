import { describe, it, expect } from 'vitest';
import {
  calculateBalances,
  computeSettlementTransfers,
  generateWhatsAppSummary,
  generateUpiDeepLink,
} from '@shared/settlement';
import type { Participant } from '@shared/schemas/trip';
import type { Expense } from '@shared/schemas/expense';
import type { Settlement } from '@shared/schemas/settlement';

describe('shared/settlement.ts', () => {
  const participants: Participant[] = [
    { id: 'p1', name: 'Rahul', colorKey: 'lagoon' },
    { id: 'p2', name: 'Sanket', colorKey: 'coral' },
    { id: 'p3', name: 'Ananya', colorKey: 'sunshine' },
  ];

  it('calculates zero balances when there are no expenses (all settled)', () => {
    const balances = calculateBalances(participants, []);
    expect(balances).toHaveLength(3);
    for (const b of balances) {
      expect(b.totalPaidMinor).toBe(0);
      expect(b.totalOwedMinor).toBe(0);
      expect(b.netBalanceMinor).toBe(0);
    }

    const transfers = computeSettlementTransfers(balances);
    expect(transfers).toHaveLength(0);
  });

  it('calculates correct net balances for an even split expense', () => {
    // Rahul pays ₹300 (30000 paise) split equally among Rahul, Sanket, Ananya (10000 each)
    const expense: Expense = {
      _id: 'e1',
      tripId: 't1',
      title: 'Lunch',
      amountMinor: 30000,
      date: '2026-10-28',
      categoryKey: 'food',
      paidBy: 'p1',
      split: {
        mode: 'equal',
        shares: [
          { participantId: 'p1', amountMinor: 10000 },
          { participantId: 'p2', amountMinor: 10000 },
          { participantId: 'p3', amountMinor: 10000 },
        ],
      },
      notes: '',
      photos: [],
      createdAt: '2026-10-28T00:00:00Z',
    };

    const balances = calculateBalances(participants, [expense]);
    const rahul = balances.find((b) => b.participantId === 'p1');
    const sanket = balances.find((b) => b.participantId === 'p2');
    const ananya = balances.find((b) => b.participantId === 'p3');

    // Rahul paid 30000, owed 10000 => net +20000
    expect(rahul?.netBalanceMinor).toBe(20000);
    // Sanket paid 0, owed 10000 => net -10000
    expect(sanket?.netBalanceMinor).toBe(-10000);
    // Ananya paid 0, owed 10000 => net -10000
    expect(ananya?.netBalanceMinor).toBe(-10000);

    const transfers = computeSettlementTransfers(balances);
    expect(transfers).toHaveLength(2);
    expect(transfers).toEqual(
      expect.arrayContaining([
        {
          fromId: 'p2',
          fromName: 'Sanket',
          toId: 'p1',
          toName: 'Rahul',
          amountMinor: 10000,
        },
        {
          fromId: 'p3',
          fromName: 'Ananya',
          toId: 'p1',
          toName: 'Rahul',
          amountMinor: 10000,
        },
      ])
    );
  });

  it('handles an excluded participant correctly', () => {
    // Sanket pays ₹500 (50000 paise) for a scuba diving ticket shared only between Sanket and Ananya
    // Rahul is not part of this expense
    const expense: Expense = {
      _id: 'e2',
      tripId: 't1',
      title: 'Scuba Diving',
      amountMinor: 50000,
      date: '2026-10-28',
      categoryKey: 'activities',
      paidBy: 'p2',
      split: {
        mode: 'equal',
        shares: [
          { participantId: 'p2', amountMinor: 25000 },
          { participantId: 'p3', amountMinor: 25000 },
        ],
      },
      notes: '',
      photos: [],
      createdAt: '2026-10-28T00:00:00Z',
    };

    const balances = calculateBalances(participants, [expense]);
    const rahul = balances.find((b) => b.participantId === 'p1');
    const sanket = balances.find((b) => b.participantId === 'p2');
    const ananya = balances.find((b) => b.participantId === 'p3');

    expect(rahul?.netBalanceMinor).toBe(0); // Excluded, net 0
    expect(sanket?.netBalanceMinor).toBe(25000); // Paid 50000, owed 25000 => +25000
    expect(ananya?.netBalanceMinor).toBe(-25000); // Paid 0, owed 25000 => -25000

    const transfers = computeSettlementTransfers(balances);
    expect(transfers).toHaveLength(1);
    expect(transfers[0]).toEqual({
      fromId: 'p3',
      fromName: 'Ananya',
      toId: 'p2',
      toName: 'Sanket',
      amountMinor: 25000,
    });
  });

  it('minimizes circular debt (greedy matching eliminates intermediary transfers)', () => {
    // Expense 1: Rahul pays ₹100 for Sanket (Sanket owes Rahul ₹100)
    // Expense 2: Sanket pays ₹100 for Ananya (Ananya owes Sanket ₹100)
    // Net result: Sanket is balanced (net 0), Ananya owes Rahul ₹100 directly.
    const e1: Expense = {
      _id: 'e1',
      tripId: 't1',
      title: 'Cab',
      amountMinor: 10000,
      date: '2026-10-28',
      categoryKey: 'transport',
      paidBy: 'p1',
      split: {
        mode: 'exact',
        shares: [{ participantId: 'p2', amountMinor: 10000 }],
      },
      notes: '',
      photos: [],
      createdAt: '2026-10-28T00:00:00Z',
    };
    const e2: Expense = {
      _id: 'e2',
      tripId: 't1',
      title: 'Drinks',
      amountMinor: 10000,
      date: '2026-10-28',
      categoryKey: 'drinks',
      paidBy: 'p2',
      split: {
        mode: 'exact',
        shares: [{ participantId: 'p3', amountMinor: 10000 }],
      },
      notes: '',
      photos: [],
      createdAt: '2026-10-28T00:00:00Z',
    };

    const balances = calculateBalances(participants, [e1, e2]);
    const transfers = computeSettlementTransfers(balances);

    expect(transfers).toHaveLength(1);
    expect(transfers[0]).toEqual({
      fromId: 'p3',
      fromName: 'Ananya',
      toId: 'p1',
      toName: 'Rahul',
      amountMinor: 10000,
    });
  });

  it('correctly incorporates settlement payments (A paid B ₹X)', () => {
    // Initial expense: Rahul paid ₹200 for Sanket (Sanket owes Rahul ₹200)
    const expense: Expense = {
      _id: 'e1',
      tripId: 't1',
      title: 'Dinner',
      amountMinor: 20000,
      date: '2026-10-28',
      categoryKey: 'food',
      paidBy: 'p1',
      split: {
        mode: 'exact',
        shares: [{ participantId: 'p2', amountMinor: 20000 }],
      },
      notes: '',
      photos: [],
      createdAt: '2026-10-28T00:00:00Z',
    };

    // Settlement payment: Sanket paid Rahul ₹150
    const settlement: Settlement = {
      _id: 's1',
      tripId: 't1',
      from: 'p2',
      to: 'p1',
      amountMinor: 15000,
      date: '2026-10-28',
      notes: 'GPay transfer',
      createdAt: '2026-10-28T01:00:00Z',
    };

    const balances = calculateBalances(participants, [expense], [settlement]);
    const rahul = balances.find((b) => b.participantId === 'p1');
    const sanket = balances.find((b) => b.participantId === 'p2');

    // Rahul was owed 20000, received 15000 repayment => remaining owed 5000 (+5000)
    expect(rahul?.netBalanceMinor).toBe(5000);
    // Sanket owed 20000, made 15000 repayment => remaining debt 5000 (-5000)
    expect(sanket?.netBalanceMinor).toBe(-5000);

    const transfers = computeSettlementTransfers(balances);
    expect(transfers).toHaveLength(1);
    expect(transfers[0]?.amountMinor).toBe(5000);
  });

  it('generates WhatsApp summary text correctly', () => {
    const transfers = [
      {
        fromId: 'p2',
        fromName: 'Sanket',
        toId: 'p1',
        toName: 'Rahul',
        amountMinor: 124000,
      },
    ];

    const summary = generateWhatsAppSummary('Goa Holiday', 'INR', transfers, 350000);
    expect(summary).toContain('Goa Holiday');
    expect(summary).toContain('Total Trip Spend: ₹3,500');
    expect(summary).toContain('Sanket owes Rahul: ₹1,240');
    expect(summary).toContain('Shared via Tripsplit');
  });

  it('generates clean UPI deep link with paise converted to rupees', () => {
    const url = generateUpiDeepLink({
      pa: 'rahul@okhdfcbank',
      pn: 'Rahul Sharma',
      amountMinor: 124050, // ₹1,240.50
      note: 'Goa Trip Settlement',
    });

    expect(url).toContain('upi://pay?');
    expect(url).toContain('pa=rahul%40okhdfcbank');
    expect(url).toContain('am=1240.50');
    expect(url).toContain('cu=INR');
  });
});
