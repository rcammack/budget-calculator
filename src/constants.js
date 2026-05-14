export const STORAGE_KEY = 'home-affordability-calculator-inputs-v1'

export const DOWN_PAYMENT_OPTIONS = [3.5, 5, 10, 20]

export const CREDIT_SCORE_OPTIONS = [
  { value: 'lt580', label: '<580', factor: 0.78, recommendedDown: 10 },
  { value: '580-619', label: '580-619', factor: 0.85, recommendedDown: 5 },
  { value: '620-659', label: '620-659', factor: 0.92, recommendedDown: 5 },
  { value: '660-719', label: '660-719', factor: 1, recommendedDown: 10 },
  { value: '720-759', label: '720-759', factor: 1.05, recommendedDown: 10 },
  { value: '760plus', label: '760+', factor: 1.1, recommendedDown: 20 },
]

export const DEFAULT_INPUTS = {
  primarySalary: 120000,
  primaryPassive: 500,
  primaryPassiveFrequency: 'monthly',
  includePartner: false,
  partnerSalary: 90000,
  partnerPassive: 400,
  partnerPassiveFrequency: 'monthly',
  creditBand: '720-759',
  mortgageRate: 6.75,
  monthlyDebts: 600,
  monthlyHoa: 350,
  monthlyInsurance: 175,
  propertyTaxRate: 0.28,
  costOfLivingAdjustment: 8,
}
