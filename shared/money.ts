/**
 * Money utilities: All calculations and storage in integer minor units (paise).
 * Floating point operations strictly avoided.
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  THB: '฿',
  AED: 'AED ',
  SGD: 'S$',
};

export interface FormatMoneyOptions {
  showSign?: boolean;
  includeSymbol?: boolean;
}

/**
 * Format minor units into user-friendly currency string (e.g. 124050 -> "₹1,240.50" or "₹1,240")
 */
export function formatMoney(
  amountMinor: number,
  currency = 'INR',
  options: FormatMoneyOptions = {}
): string {
  const { showSign = false, includeSymbol = true } = options;
  const isNegative = amountMinor < 0;
  const absMinor = Math.abs(amountMinor);
  const units = Math.floor(absMinor / 100);
  const remainder = absMinor % 100;

  let formattedUnits: string;
  if (currency === 'INR') {
    // Indian numbering format: 1,23,456
    formattedUnits = formatIndianNumber(units);
  } else {
    formattedUnits = units.toLocaleString('en-US');
  }

  const decimalPart = remainder > 0 ? `.${remainder.toString().padStart(2, '0')}` : '';
  const symbol = includeSymbol ? (CURRENCY_SYMBOLS[currency] ?? `${currency} `) : '';
  const sign = isNegative ? '-' : showSign && amountMinor > 0 ? '+' : '';

  return `${sign}${symbol}${formattedUnits}${decimalPart}`;
}

/**
 * Helper to format Indian numbering system (e.g. 100000 -> "1,00,000")
 */
function formatIndianNumber(x: number): string {
  const s = x.toString();
  if (s.length <= 3) return s;
  const lastThree = s.slice(-3);
  const otherNumbers = s.slice(0, -3);
  const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${formattedOther},${lastThree}`;
}

/**
 * Parses user input e.g. "1,240.50" or "500" into integer minor units (paise)
 */
export function parseMoneyInput(input: string): number {
  if (!input || typeof input !== 'string') return 0;
  // Clean whitespace, commas, currency symbols
  const cleaned = input.trim().replace(/[^0-9.-]/g, '');
  if (!cleaned) return 0;

  const parts = cleaned.split('.');
  const wholePart = parts[0] || '0';
  const whole = parseInt(wholePart, 10);
  if (Number.isNaN(whole)) return 0;

  let minor = whole * 100;
  if (parts.length > 1 && parts[1]) {
    const fractionStr = parts[1].slice(0, 2).padEnd(2, '0');
    const fraction = parseInt(fractionStr, 10);
    if (!Number.isNaN(fraction)) {
      minor = minor >= 0 ? minor + fraction : minor - fraction;
    }
  }

  return minor;
}

/**
 * Distributes totalMinor evenly among count participants,
 * giving any remainder deterministically to the first N participants (+1 each).
 */
export function distributeRemainder(totalMinor: number, count: number): number[] {
  if (count <= 0) return [];
  const baseShare = Math.floor(totalMinor / count);
  const remainder = totalMinor - baseShare * count;

  return Array.from({ length: count }, (_, i) => {
    return i < remainder ? baseShare + 1 : baseShare;
  });
}
