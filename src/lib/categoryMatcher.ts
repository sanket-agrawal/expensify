import type { Component } from 'vue';
import {
  Bed,
  Utensils,
  Wine,
  Coffee,
  ShoppingBasket,
  Fuel,
  Car,
  Plane,
  Train,
  CircleParking,
  Compass,
  Ticket,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Coins,
  Receipt,
} from 'lucide-vue-next';
import type { CategoryKey } from '@shared/schemas/expense';
import type { ChipColor } from '@/components/ui/IconChip.vue';

export interface CategoryDefinition {
  key: CategoryKey;
  label: string;
  icon: Component;
  color: ChipColor;
  keywords: string[];
}

export const CATEGORIES: Record<CategoryKey, CategoryDefinition> = {
  coffee_chai: {
    key: 'coffee_chai',
    label: 'Coffee & Chai',
    icon: Coffee,
    color: 'sunshine',
    keywords: [
      'chai', 'tea', 'coffee', 'cafe', 'starbucks', 'tapri', 'cappuccino', 'latte',
      'espresso', 'cold coffee', 'irani chai', 'masala chai', 'cutting chai',
      'beverage', 'iced tea', 'matcha', 'brew',
    ],
  },
  food: {
    key: 'food',
    label: 'Food & Meals',
    icon: Utensils,
    color: 'coral',
    keywords: [
      'dhaba', 'thali', 'biryani', 'dinner', 'lunch', 'breakfast', 'meal',
      'food', 'pizza', 'burger', 'restaurant', 'roti', 'dosa', 'idli', 'snack',
      'snacks', 'swiggy', 'zomato', 'paneer', 'chicken', 'mutton', 'momo',
      'momos', 'maggi', 'buffet', 'chaat', 'sandwich', 'pasta', 'shawarma',
      'seafood', 'fish curry', 'noodles', 'dessert', 'ice cream', 'bakery',
    ],
  },
  drinks: {
    key: 'drinks',
    label: 'Drinks & Alcohol',
    icon: Wine,
    color: 'deep-sea',
    keywords: [
      'beer', 'wine', 'whiskey', 'whisky', 'cocktail', 'pub', 'booze', 'alcohol',
      'rum', 'vodka', 'gin', 'scotch', 'tequila', 'margarita', 'mocktail', 'liquor',
      'bar bill', 'kingfisher', 'corona', 'bira', 'brewery',
    ],
  },
  stay: {
    key: 'stay',
    label: 'Stay & Hotel',
    icon: Bed,
    color: 'lagoon',
    keywords: [
      'homestay', 'resort', 'hotel', 'hostel', 'villa', 'airbnb', 'room',
      'oyo', 'booking', 'stay', 'lodge', 'lodging', 'guesthouse', 'cottage',
      'tent', 'camping', 'checkin', 'checkout', 'dorm', 'shack',
    ],
  },
  fuel: {
    key: 'fuel',
    label: 'Fuel & Petrol',
    icon: Fuel,
    color: 'coral',
    keywords: [
      'petrol', 'diesel', 'fuel', 'cng', 'petrol pump', 'gas station',
      'indian oil', 'bharat petroleum', 'shell', 'hp pump', 'ev charging',
    ],
  },
  toll_parking: {
    key: 'toll_parking',
    label: 'Toll & Parking',
    icon: CircleParking,
    color: 'sand',
    keywords: [
      'toll', 'parking', 'fastag', 'toll plaza', 'toll booth', 'parking fee',
      'valet', 'valet parking', 'toll gate',
    ],
  },
  flights: {
    key: 'flights',
    label: 'Flights',
    icon: Plane,
    color: 'sky',
    keywords: [
      'flight', 'airfare', 'indigo', 'air india', 'vistara', 'spicejet',
      'akasa', 'airplane', 'airport', 'boarding pass', 'flight ticket', 'airline',
    ],
  },
  train_bus: {
    key: 'train_bus',
    label: 'Train & Bus',
    icon: Train,
    color: 'deep-sea',
    keywords: [
      'train', 'bus', 'irctc', 'sleeper', 'volvo', 'redbus', 'metro',
      'railway', 'ksrtc', 'msrtc', 'interstate bus', 'local train', 'tatkal',
    ],
  },
  transport: {
    key: 'transport',
    label: 'Cab & Local Transport',
    icon: Car,
    color: 'seafoam',
    keywords: [
      'auto', 'cab', 'taxi', 'ola', 'uber', 'rickshaw', 'rapido', 'scooty',
      'bike rental', 'car rental', 'rental bike', 'car hire', 'boat', 'ferry',
      'tuk tuk', 'auto rickshaw', 'activa', 'bike hire',
    ],
  },
  groceries: {
    key: 'groceries',
    label: 'Groceries & Supplies',
    icon: ShoppingBasket,
    color: 'seafoam',
    keywords: [
      'groceries', 'supermarket', 'instamart', 'blinkit', 'zepto', 'market',
      'vegetables', 'milk', 'water bottle', 'bisleri', 'chips', 'biscuits',
      'fruits', 'ration', 'convenience store',
    ],
  },
  tickets: {
    key: 'tickets',
    label: 'Tickets & Entry',
    icon: Ticket,
    color: 'sunshine',
    keywords: [
      'ticket', 'tickets', 'entry fee', 'monument', 'museum', 'fort',
      'palace', 'entry ticket', 'entry pass', 'amusement park', 'water park',
      'cinema', 'movie ticket', 'aquarium',
    ],
  },
  activities: {
    key: 'activities',
    label: 'Activities & Adventure',
    icon: Compass,
    color: 'lagoon',
    keywords: [
      'scuba', 'scuba diving', 'surf', 'surfing', 'rafting', 'trek', 'trekking',
      'kayak', 'kayaking', 'paragliding', 'safari', 'snorkeling', 'zip line',
      'bungee', 'boating', 'adventure', 'jet ski', 'banana ride', 'sightseeing',
    ],
  },
  shopping: {
    key: 'shopping',
    label: 'Shopping',
    icon: ShoppingBag,
    color: 'coral',
    keywords: [
      'shopping', 'souvenir', 'clothes', 'flea market', 't-shirt', 'gift',
      'handicrafts', 'mall', 'dress', 'shoes', 'bazaar',
    ],
  },
  nightlife: {
    key: 'nightlife',
    label: 'Nightlife & Clubbing',
    icon: Sparkles,
    color: 'deep-sea',
    keywords: [
      'club', 'disco', 'nightclub', 'entry club', 'party', 'dj night',
      'lounge', 'rave', 'casino', 'rooftop bar', 'cover charge',
    ],
  },
  medical: {
    key: 'medical',
    label: 'Medical & Health',
    icon: Stethoscope,
    color: 'coral',
    keywords: [
      'pharmacy', 'medicine', 'medical', 'doctor', 'clinic', 'pills',
      'paracetamol', 'bandage', 'band-aid', 'hospital', 'first aid', 'crocin',
    ],
  },
  tips: {
    key: 'tips',
    label: 'Tips & Gratuity',
    icon: Coins,
    color: 'sunshine',
    keywords: [
      'tip', 'tips', 'baksheesh', 'gratuity', 'driver tip', 'waiter tip',
      'service tip',
    ],
  },
  misc: {
    key: 'misc',
    label: 'Misc Expense',
    icon: Receipt,
    color: 'neutral',
    keywords: ['misc', 'miscellaneous', 'other', 'general'],
  },
};

/**
 * Normalizes input: lowercase, trim, strip punctuation to single spaces
 */
export function normalizeText(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Levenshtein distance for fuzzy matching typos
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const charA = a[i - 1];
      const charB = b[j - 1];
      const val = charA === charB ? (row[j - 1] ?? 0) : Math.min(row[j - 1] ?? 0, prev, row[j] ?? 0) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length] ?? 0;
}

/**
 * Simple English suffix stemmer for plurals
 */
function stemWord(word: string): string {
  if (word.endsWith('ies') && word.length > 4) {
    return word.slice(0, -3) + 'y';
  }
  if (word.endsWith('es') && word.length > 4) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && word.length > 3 && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  return word;
}

/**
 * Determines whether a word fuzzy-matches a keyword
 */
function isFuzzyMatch(word: string, keyword: string): boolean {
  if (word === keyword) return true;
  const stem = stemWord(word);
  if (stem === keyword) return true;

  // Substring match for compound words
  if (keyword.length >= 4 && word.includes(keyword)) return true;
  if (word.length >= 4 && keyword.includes(word)) return true;

  const len = Math.max(word.length, keyword.length);
  if (len <= 3) return word === keyword;

  const dist = Math.min(levenshtein(word, keyword), levenshtein(stem, keyword));
  if (len >= 7) return dist <= 2;
  return dist <= 1;
}

/**
 * Detects the best category matching the given title.
 * Performs multi-word phrase matching first, then single-word token matching, then fuzzy matching.
 */
export function detectCategory(title: string): CategoryDefinition {
  const norm = normalizeText(title);
  if (!norm) return CATEGORIES.misc;

  // 1. Exact phrase matching (multi-word keywords take highest precedence)
  for (const cat of Object.values(CATEGORIES)) {
    if (cat.key === 'misc') continue;
    for (const kw of cat.keywords) {
      if (kw.includes(' ')) {
        // Multi-word phrase regex with word boundaries
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(norm)) {
          return cat;
        }
      }
    }
  }

  // 2. Tokenize normalized title
  const words = norm.split(' ').filter(Boolean);

  // 3. Exact single-word match (including stemmed words)
  for (const word of words) {
    const stem = stemWord(word);
    for (const cat of Object.values(CATEGORIES)) {
      if (cat.key === 'misc') continue;
      for (const kw of cat.keywords) {
        if (!kw.includes(' ') && (word === kw || stem === kw)) {
          return cat;
        }
      }
    }
  }

  // 4. Fuzzy typo matching (e.g. "pettrol" -> fuel, "dhabba" -> food, "rickshw" -> transport)
  for (const word of words) {
    if (word.length < 3) continue;
    for (const cat of Object.values(CATEGORIES)) {
      if (cat.key === 'misc') continue;
      for (const kw of cat.keywords) {
        if (!kw.includes(' ') && isFuzzyMatch(word, kw)) {
          return cat;
        }
      }
    }
  }

  return CATEGORIES.misc;
}
