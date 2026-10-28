export interface AppConfig {
  appName: string;
  appTagline: string;
  defaultCurrency: string;
  supportedCurrencies: Array<{ code: string; symbol: string; label: string }>;
  maxParticipants: number;
  minParticipants: number;
  maxPhotoSizeBytes: number;
  allowedPhotoMimeTypes: string[];
}

export const APP_CONFIG: AppConfig = {
  appName: 'Tripsplit',
  appTagline: 'Chill trip expense splitting',
  defaultCurrency: 'INR',
  supportedCurrencies: [
    { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
    { code: 'THB', symbol: '฿', label: 'Thai Baht' },
    { code: 'AED', symbol: 'AED', label: 'UAE Dirham' },
    { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  ],
  minParticipants: 2,
  maxParticipants: 10,
  maxPhotoSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedPhotoMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
};
