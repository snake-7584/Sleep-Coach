import { usdContent } from './usd'
import { inrContent } from './inr'

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  flag: string
}

export const supportedCurrencies: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
]

export function getContent(currency: string) {
  switch (currency) {
    case 'INR':
    case 'JPY':
      return inrContent
    case 'USD':
    case 'EUR':
    case 'GBP':
    case 'AUD':
    case 'CAD':
    default:
      return usdContent
  }
}

export function getCurrencyInfo(code: string): CurrencyInfo {
  return supportedCurrencies.find(c => c.code === code) || supportedCurrencies[0]
}

export type ContentModules = typeof usdContent
