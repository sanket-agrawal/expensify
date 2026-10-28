import { describe, it, expect } from 'vitest';
import { detectCategory, normalizeText } from '@/lib/categoryMatcher';

describe('src/lib/categoryMatcher.ts', () => {
  it('normalizes text stripping punctuation and extra spaces', () => {
    expect(normalizeText('  Hot Chai!! & samosa...  ')).toBe('hot chai samosa');
    expect(normalizeText('PETROL / CNG')).toBe('petrol cng');
  });

  // At least 40 phrases test suite
  const testCases: Array<{ phrase: string; expectedCategory: string }> = [
    // 1-5: Coffee & Chai
    { phrase: 'Morning cutting chai and bun maska', expectedCategory: 'coffee_chai' },
    { phrase: 'Starbucks cold brew', expectedCategory: 'coffee_chai' },
    { phrase: 'Tapri tea and biscuits', expectedCategory: 'coffee_chai' },
    { phrase: 'Hot cappuccino at cafe', expectedCategory: 'coffee_chai' },
    { phrase: 'Irani chai at bakery', expectedCategory: 'coffee_chai' },

    // 6-11: Food
    { phrase: 'Highway dhaba lunch', expectedCategory: 'food' },
    { phrase: 'Goan fish thali in Anjuna', expectedCategory: 'food' },
    { phrase: 'Hyderabadi chicken biryani dinner', expectedCategory: 'food' },
    { phrase: 'Late night Maggi on roadside', expectedCategory: 'food' },
    { phrase: 'Woodfired pizza and pasta', expectedCategory: 'food' },
    { phrase: 'Swiggy order to villa', expectedCategory: 'food' },

    // 12-16: Drinks
    { phrase: 'Chilled Kingfisher beer bucket', expectedCategory: 'drinks' },
    { phrase: 'Red wine bottle at dinner', expectedCategory: 'drinks' },
    { phrase: 'Old monk rum with cola', expectedCategory: 'drinks' },
    { phrase: 'Cocktails at beach shack', expectedCategory: 'drinks' },
    { phrase: 'Booze from wine shop', expectedCategory: 'drinks' },

    // 17-21: Stay
    { phrase: 'Goa beach homestay booking', expectedCategory: 'stay' },
    { phrase: 'Luxury resort checkin deposit', expectedCategory: 'stay' },
    { phrase: 'Hostel dorm bed in Vagator', expectedCategory: 'stay' },
    { phrase: 'Private pool villa Airbnb', expectedCategory: 'stay' },
    { phrase: 'Camping tent rent', expectedCategory: 'stay' },

    // 22-25: Fuel
    { phrase: 'Full tank petrol for car', expectedCategory: 'fuel' },
    { phrase: 'Diesel refill at Indian Oil', expectedCategory: 'fuel' },
    { phrase: 'CNG gas station fillup', expectedCategory: 'fuel' },
    { phrase: 'Shell petrol pump bill', expectedCategory: 'fuel' },

    // 26-28: Toll & Parking
    { phrase: 'Mumbai-Pune expressway toll plaza', expectedCategory: 'toll_parking' },
    { phrase: 'Airport parking fee', expectedCategory: 'toll_parking' },
    { phrase: 'Fastag toll deduction', expectedCategory: 'toll_parking' },

    // 29-31: Flights
    { phrase: 'Indigo flight tickets to Goa', expectedCategory: 'flights' },
    { phrase: 'Airfare booking on MakeMyTrip', expectedCategory: 'flights' },
    { phrase: 'Airport terminal boarding pass fee', expectedCategory: 'flights' },

    // 32-34: Train & Bus
    { phrase: 'IRCTC train ticket booking', expectedCategory: 'train_bus' },
    { phrase: 'Volvo sleeper bus from Bangalore', expectedCategory: 'train_bus' },
    { phrase: 'Redbus overnight ride', expectedCategory: 'train_bus' },

    // 35-40: Transport (Local)
    { phrase: 'Auto rickshaw to Calangute beach', expectedCategory: 'transport' },
    { phrase: 'Ola cab from railway station', expectedCategory: 'transport' },
    { phrase: 'Uber ride back to hotel', expectedCategory: 'transport' },
    { phrase: 'Scooty rental for 3 days', expectedCategory: 'transport' },
    { phrase: 'Activa bike rental fee', expectedCategory: 'transport' },
    { phrase: 'Ferry boat ride across Mandovi river', expectedCategory: 'transport' },

    // 41-43: Groceries
    { phrase: 'Bisleri water bottle and chips', expectedCategory: 'groceries' },
    { phrase: 'Blinkit supermarket snacks delivery', expectedCategory: 'groceries' },
    { phrase: 'Zepto groceries for breakfast', expectedCategory: 'groceries' },

    // 44-46: Tickets
    { phrase: 'Fort Aguada entry ticket', expectedCategory: 'tickets' },
    { phrase: 'Museum entrance fee', expectedCategory: 'tickets' },
    { phrase: 'Amusement water park pass', expectedCategory: 'tickets' },

    // 47-49: Activities
    { phrase: 'Scuba diving at Grand Island', expectedCategory: 'activities' },
    { phrase: 'Kayaking in Chapora river backwaters', expectedCategory: 'activities' },
    { phrase: 'Trekking guide and permits', expectedCategory: 'activities' },

    // 50-52: Nightlife
    { phrase: 'Club Tito cover charge', expectedCategory: 'nightlife' },
    { phrase: 'DJ night disco entry tickets', expectedCategory: 'nightlife' },
    { phrase: 'Casino entry chips in Panjim', expectedCategory: 'nightlife' },

    // 53-54: Shopping
    { phrase: 'Anjuna flea market clothes and souvenirs', expectedCategory: 'shopping' },
    { phrase: 'Beach shorts and sunglasses from bazaar', expectedCategory: 'shopping' },

    // 55-56: Medical
    { phrase: 'Paracetamol and bandages from pharmacy', expectedCategory: 'medical' },
    { phrase: 'First aid and Crocin pills', expectedCategory: 'medical' },

    // 57-58: Tips
    { phrase: 'Driver tip for 4 days service', expectedCategory: 'tips' },
    { phrase: 'Waiter tip at restaurant', expectedCategory: 'tips' },

    // 59-64: Fuzzy Typo Matching
    { phrase: 'pettrol for bike', expectedCategory: 'fuel' },
    { phrase: 'dhabba dinner meal', expectedCategory: 'food' },
    { phrase: 'beerr with friends', expectedCategory: 'drinks' },
    { phrase: 'homestaye deposit', expectedCategory: 'stay' },
    { phrase: 'auto rickshw ride', expectedCategory: 'transport' },
    { phrase: 'medicne from shop', expectedCategory: 'medical' },
  ];

  it('matches all 64 diverse phrases and typos to the right categories', () => {
    for (const { phrase, expectedCategory } of testCases) {
      const match = detectCategory(phrase);
      expect(
        match.key,
        `Expected phrase "${phrase}" to match category "${expectedCategory}" but got "${match.key}"`
      ).toBe(expectedCategory);
    }
  });

  it('falls back to misc when title contains no matching keywords', () => {
    expect(detectCategory('something random 12345').key).toBe('misc');
    expect(detectCategory('').key).toBe('misc');
  });
});
