export const STORAGE_KEY = 'home-affordability-calculator-inputs-v1'
export const SPENDING_STORAGE_KEY = 'budget-spending-items-v1'

export const MAX_401K_CONTRIBUTION = 23500  // 2025 IRS limit (under age 50)

export const TAX_RATE_SINGLE  = 30  // Federal + Hawaii + FICA, single filer
export const TAX_RATE_MARRIED = 28  // MFJ typically ~2% lower for unequal incomes

export const DOWN_PAYMENT_OPTIONS = [3.5, 5, 10, 20]

export const CREDIT_SCORE_OPTIONS = [
  { value: 'lt580', label: '<580', factor: 0.78, recommendedDown: 10 },
  { value: '580-619', label: '580-619', factor: 0.85, recommendedDown: 5 },
  { value: '620-659', label: '620-659', factor: 0.92, recommendedDown: 5 },
  { value: '660-719', label: '660-719', factor: 1, recommendedDown: 10 },
  { value: '720-759', label: '720-759', factor: 1.05, recommendedDown: 10 },
  { value: '760plus', label: '760+', factor: 1.1, recommendedDown: 20 },
]

export const INVESTMENT_ACCOUNTS = [
  { key: 'Hysa',    label: 'HYSA',               defaultRate: 4.75 },
  { key: 'Cd',      label: 'CDs',                defaultRate: 5.0  },
  { key: 'Stocks',  label: 'Stocks / Brokerage', defaultRate: 7.0  },
  { key: 'Savings', label: 'Savings / Checking', defaultRate: 0.5  },
  // ESPP: balance field = annual contribution; return = discount gain + stock appreciation
  { key: 'Espp',    label: 'ESPP (10% discount)', defaultRate: 0, type: 'espp' },
]

export const ESPP_DISCOUNT = 0.10

export const DEFAULT_SPENDING_ITEMS = [
  { id: '1', name: 'Groceries', amount: 600, frequency: 'monthly' },
  { id: '2', name: 'Car payment', amount: 400, frequency: 'monthly' },
  { id: '3', name: 'Utilities', amount: 200, frequency: 'monthly' },
]

export const DEFAULT_INPUTS = {
  incomeMode: 'net',
  effectiveTaxRate: 30,
  primarySalary: 120000,
  primaryPassive: 500,
  primaryPassiveFrequency: 'monthly',
  primaryHysaBalance: 0,
  primaryHysaRate: 4.75,
  primaryCdBalance: 0,
  primaryCdRate: 5.0,
  primaryStocksBalance: 0,
  primaryStocksRate: 7.0,
  primarySavingsBalance: 0,
  primarySavingsRate: 0.5,
  primary401kContribution: 23500,
  primary401kMatchPercent: 50,
  primaryEsppBalance: 0,
  primaryEsppRate: 0,

  partnerSalary: 90000,
  partnerPassive: 400,
  partnerPassiveFrequency: 'monthly',
  partnerHysaBalance: 0,
  partnerHysaRate: 4.75,
  partnerCdBalance: 0,
  partnerCdRate: 5.0,
  partnerStocksBalance: 0,
  partnerStocksRate: 7.0,
  partnerSavingsBalance: 0,
  partnerSavingsRate: 0.5,
  partner401kContribution: 23500,
  partner401kMatchPercent: 50,
  partnerEsppBalance: 0,
  partnerEsppRate: 0,

  mortgageRate: 6.75,
  monthlyDebts: 600,
  monthlyHoa: 500,
  monthlyInsurance: 175,
  propertyTaxRate: 0.28,
  costOfLivingAdjustment: 10,
  housingAppreciationRate: 5,
  targetHomePrice: 1250000,
  annualSavingsContribution: 0,
}
