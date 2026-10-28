import { distributeRemainder } from './money';
import type { SplitShare } from './schemas/expense';

export interface SplitCalculationResult {
  isValid: boolean;
  remainderMinor: number;
  remainderPercentage?: number;
  shares: SplitShare[];
  errorMessage?: string;
}

/**
 * Calculates equal split among participants.
 * Deterministically distributes leftover paise: the first N participants get +1 minor unit.
 */
export function calculateEqualSplit(
  totalAmountMinor: number,
  participantIds: string[]
): SplitCalculationResult {
  if (participantIds.length === 0) {
    return {
      isValid: false,
      remainderMinor: totalAmountMinor,
      shares: [],
      errorMessage: 'At least one participant required',
    };
  }

  const amounts = distributeRemainder(totalAmountMinor, participantIds.length);
  const shares: SplitShare[] = participantIds.map((id, index) => ({
    participantId: id,
    amountMinor: amounts[index] ?? 0,
  }));

  return {
    isValid: true,
    remainderMinor: 0,
    shares,
  };
}

/**
 * Validates exact amount split where each participant has an assigned amountMinor.
 * Calculates live remainder: totalAmountMinor - sum(assigned amounts).
 */
export function calculateExactSplit(
  totalAmountMinor: number,
  shares: Array<{ participantId: string; amountMinor: number }>
): SplitCalculationResult {
  if (shares.length === 0) {
    return {
      isValid: false,
      remainderMinor: totalAmountMinor,
      shares: [],
      errorMessage: 'At least one participant required',
    };
  }

  const allocatedMinor = shares.reduce((sum, s) => sum + s.amountMinor, 0);
  const remainderMinor = totalAmountMinor - allocatedMinor;
  const isValid = remainderMinor === 0;

  let errorMessage: string | undefined;
  if (remainderMinor > 0) {
    errorMessage = `${remainderMinor} paise remaining to allocate`;
  } else if (remainderMinor < 0) {
    errorMessage = `${Math.abs(remainderMinor)} paise over-allocated`;
  }

  return {
    isValid,
    remainderMinor,
    shares: shares.map((s) => ({
      participantId: s.participantId,
      amountMinor: s.amountMinor,
    })),
    errorMessage,
  };
}

/**
 * Calculates percentage split based on percentage per participant.
 * Ensures total shares sum exactly to totalAmountMinor by distributing rounding difference.
 */
export function calculatePercentageSplit(
  totalAmountMinor: number,
  sharesWithPct: Array<{ participantId: string; percentage: number }>
): SplitCalculationResult {
  if (sharesWithPct.length === 0) {
    return {
      isValid: false,
      remainderMinor: totalAmountMinor,
      remainderPercentage: 100,
      shares: [],
      errorMessage: 'At least one participant required',
    };
  }

  const totalPct = sharesWithPct.reduce((sum, s) => sum + s.percentage, 0);
  // Rounded to 2 decimal places
  const normalizedTotalPct = Math.round(totalPct * 100) / 100;
  const remainderPct = Math.round((100 - normalizedTotalPct) * 100) / 100;

  // Calculate base amounts for each participant
  let allocatedSoFar = 0;
  const computedShares: SplitShare[] = sharesWithPct.map((s) => {
    // Floor to avoid exceeding total
    const shareMinor = Math.floor((totalAmountMinor * s.percentage) / 100);
    allocatedSoFar += shareMinor;
    return {
      participantId: s.participantId,
      amountMinor: shareMinor,
      percentage: s.percentage,
    };
  });

  // Distribute leftover paise to participants with largest percentages or first N
  let leftover = totalAmountMinor - allocatedSoFar;
  if (leftover > 0 && normalizedTotalPct === 100) {
    for (let i = 0; i < computedShares.length && leftover > 0; i++) {
      const share = computedShares[i];
      if (share) {
        share.amountMinor += 1;
        leftover -= 1;
      }
    }
  }

  const isExact100 = Math.abs(remainderPct) < 0.01;
  const finalRemainderMinor = totalAmountMinor - computedShares.reduce((s, c) => s + c.amountMinor, 0);

  let errorMessage: string | undefined;
  if (!isExact100) {
    errorMessage = remainderPct > 0
      ? `${remainderPct}% left to allocate`
      : `${Math.abs(remainderPct)}% over 100%`;
  }

  return {
    isValid: isExact100 && finalRemainderMinor === 0,
    remainderMinor: finalRemainderMinor,
    remainderPercentage: remainderPct,
    shares: computedShares,
    errorMessage,
  };
}
