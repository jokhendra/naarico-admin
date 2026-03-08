import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names with Tailwind CSS compatibility
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  displayName: string;
  decimalPlaces: number;
  isActive: boolean;
  locale: string;
  country: string;
}

export const currencies: Currency[] = [
  {
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    displayName: "Indian Rupee (₹)",
    decimalPlaces: 2,
    isActive: true,
    locale: "en-IN",
    country: "India"
  },
  {
    code: "BDT",
    name: "Bangladeshi Taka",
    symbol: "৳",
    displayName: "Bangladeshi Taka (৳)",
    decimalPlaces: 2,
    isActive: true,
    locale: "bn-BD",
    country: "Bangladesh"
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    displayName: "US Dollar ($)",
    decimalPlaces: 2,
    isActive: true,
    locale: "en-US",
    country: "United States"
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    displayName: "Euro (€)",
    decimalPlaces: 2,
    isActive: true,
    locale: "de-DE",
    country: "European Union"
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    displayName: "British Pound (£)",
    decimalPlaces: 2,
    isActive: true,
    locale: "en-GB",
    country: "United Kingdom"
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    displayName: "Japanese Yen (¥)",
    decimalPlaces: 0,
    isActive: true,
    locale: "ja-JP",
    country: "Japan"
  },
  {
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "C$",
    displayName: "Canadian Dollar (C$)",
    decimalPlaces: 2,
    isActive: true,
    locale: "en-CA",
    country: "Canada"
  },
  {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    displayName: "Australian Dollar (A$)",
    decimalPlaces: 2,
    isActive: true,
    locale: "en-AU",
    country: "Australia"
  },
  {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
    displayName: "Singapore Dollar (S$)",
    decimalPlaces: 2,
    isActive: true,
    locale: "en-SG",
    country: "Singapore"
  },
  {
    code: "AED",
    name: "UAE Dirham",
    symbol: "د.إ",
    displayName: "UAE Dirham (د.إ)",
    decimalPlaces: 2,
    isActive: true,
    locale: "ar-AE",
    country: "United Arab Emirates"
  },
  {
    code: "SAR",
    name: "Saudi Riyal",
    symbol: "﷼",
    displayName: "Saudi Riyal (﷼)",
    decimalPlaces: 2,
    isActive: true,
    locale: "ar-SA",
    country: "Saudi Arabia"
  },
  {
    code: "PKR",
    name: "Pakistani Rupee",
    symbol: "₨",
    displayName: "Pakistani Rupee (₨)",
    decimalPlaces: 2,
    isActive: true,
    locale: "ur-PK",
    country: "Pakistan"
  }
];

// Currency helper functions
export const getCurrencyByCode = (code: string): Currency | undefined => {
  return currencies.find(currency => currency.code === code);
};

export const getActiveCurrencies = (): Currency[] => {
  return currencies.filter(currency => currency.isActive);
};

export const getCurrencySymbol = (code: string): string => {
  const currency = getCurrencyByCode(code);
  return currency?.symbol || '$';
};

export const formatCurrencyAmount = (amount: number, code: string): string => {
  const currency = getCurrencyByCode(code);
  if (!currency) return `${amount} ${code}`;
  
  const formattedAmount = amount.toFixed(currency.decimalPlaces);
  return `${currency.symbol}${formattedAmount}`;
};

export const getCurrencyOptions = () => {
  return getActiveCurrencies().map(currency => ({
    value: currency.code,
    label: currency.displayName,
    symbol: currency.symbol,
    country: currency.country
  }));
};

/**
 * Returns a safe image source URL, with a fallback for empty values
 * Works with both string URLs and File objects
 */
export function getSafeImageSrc(source: string | File | Blob | undefined): string {
  if (!source) return "https://placehold.co/600x400?text=No+Image";
  
  // If it's already a string URL, return it
  if (typeof source === 'string') {
    return source;
  }
  
  // If it's a File or Blob object, create an object URL
  if (source instanceof File || source instanceof Blob) {
    return URL.createObjectURL(source);
  }
  
  return "https://placehold.co/600x400?text=No+Image";
}

/**
 * Truncates text to a specific length and adds ellipsis
 */
export function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

 /**
 * Formats a number as currency with the specified currency code
 * @param amount The amount to format
 * @param currency The currency code (e.g., 'USD', 'EUR', 'INR')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
};