export const STORAGE_KEY = 'home-affordability-calculator-inputs-v1'
export const SPENDING_STORAGE_KEY = 'budget-spending-items-v1'

export const MAX_401K_CONTRIBUTION = 23500  // 2025 IRS limit (under age 50)

export const TAX_RATE_SINGLE  = 30  // Federal + Hawaii + FICA, single filer
export const TAX_RATE_MARRIED = 28  // MFJ typically ~2% lower for unequal incomes

export const DOWN_PAYMENT_OPTIONS = [10, 20, 25, 30]

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
  { id: '1', name: 'Rent', amount: 1500, frequency: 'monthly' },
  { id: '2', name: 'Groceries', amount: 600, frequency: 'monthly' },
  { id: '3', name: 'Utilities', amount: 200, frequency: 'monthly' },
  { id: '4', name: 'Charity', amount: 10000, frequency: 'annual' },
  { id: '5', name: 'Pet Insurance', amount: 700, frequency: 'annual' },
  { id: '6', name: 'Bouldering Gym', amount: 1200, frequency: 'annual' },
  { id: '7', name: 'Trips', amount: 8000, frequency: 'annual' },
]

export const DEFAULT_INPUTS = {
  incomeMode: 'net',
  effectiveTaxRate: 30,
  creditBand: '760plus',
  primarySalary: 150000,
  primaryHysaBalance: 100000,
  primaryHysaRate: 3.0,
  primaryCdBalance: 120000,
  primaryCdRate: 4.0,
  primaryStocksBalance: 350000,
  primaryStocksRate: 7.0,
  primarySavingsBalance: 30000,
  primarySavingsRate: 0.5,
  primary401kContribution: 23500,
  primary401kMatchPercent: 50,
  primaryEsppBalance: 25000,
  primaryEsppRate: 0,

  partnerSalary: 100000,
  partnerHysaBalance: 0,
  partnerHysaRate: 4.0,
  partnerCdBalance: 0,
  partnerCdRate: 4.0,
  partnerStocksBalance: 0,
  partnerStocksRate: 7.0,
  partnerSavingsBalance: 0,
  partnerSavingsRate: 0.5,
  partner401kContribution: 23500,
  partner401kMatchPercent: 10,
  partnerEsppBalance: 0,
  partnerEsppRate: 0,

  mortgageRate: 6.75,
  monthlyDebts: 0,
  monthlyHoa: 750,
  monthlyInsurance: 175,
  propertyTaxRate: 0.28,
  costOfLivingAdjustment: 10,
  housingAppreciationRate: 5,
  targetHomePrice: 1250000,
}
