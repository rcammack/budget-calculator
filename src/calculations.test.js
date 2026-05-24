import { describe, expect, it } from 'vitest'
import { calculateScenario, getInvestmentAnnualReturn, getRequiredDownPayment, getWeightedReturnRate, projectMarketRace, toNumber } from './calculations'
import { DEFAULT_INPUTS } from './constants'

// Zero-balance variant for tests that need clean investment state
const ZERO_INPUTS = {
  ...DEFAULT_INPUTS,
  primaryHysaBalance: 0, primaryCdBalance: 0, primaryStocksBalance: 0,
  primarySavingsBalance: 0, primaryEsppBalance: 0,
  partnerHysaBalance: 0, partnerCdBalance: 0, partnerStocksBalance: 0,
  partnerSavingsBalance: 0, partnerEsppBalance: 0,
}

const GROSS_INPUTS = { ...ZERO_INPUTS, incomeMode: 'gross' }
const NET_INPUTS   = { ...ZERO_INPUTS, incomeMode: 'net', effectiveTaxRate: 30 }

describe('toNumber', () => {
  it('converts a valid string to a number', () => {
    expect(toNumber('42')).toBe(42)
  })

  it('returns 0 for negative values', () => {
    expect(toNumber(-10)).toBe(0)
  })

  it('returns 0 for non-numeric input', () => {
    expect(toNumber('abc')).toBe(0)
    expect(toNumber(undefined)).toBe(0)
    expect(toNumber(null)).toBe(0)
  })
})


describe('getInvestmentAnnualReturn', () => {
  it('returns 0 when all balances are 0', () => {
    expect(getInvestmentAnnualReturn(ZERO_INPUTS, 'primary')).toBe(0)
  })

  it('calculates standard account return correctly', () => {
    const inputs = { ...ZERO_INPUTS, primaryHysaBalance: 10000, primaryHysaRate: 5 }
    // $10,000 * 5% = $500
    expect(getInvestmentAnnualReturn(inputs, 'primary')).toBe(500)
  })

  it('sums multiple account returns', () => {
    const inputs = {
      ...ZERO_INPUTS,
      primaryHysaBalance: 10000, primaryHysaRate: 5,   // $500
      primaryCdBalance:   20000, primaryCdRate:   4,   // $800
    }
    expect(getInvestmentAnnualReturn(inputs, 'primary')).toBe(1300)
  })

  it('calculates ESPP return using discount, ignoring stock appreciation when rate is 0', () => {
    // $9,000 contribution at 10% discount → buys $10,000 of stock → gain = $1,000
    const inputs = { ...ZERO_INPUTS, primaryEsppBalance: 9000, primaryEsppRate: 0 }
    const result = getInvestmentAnnualReturn(inputs, 'primary')
    expect(result).toBeCloseTo(1000, 0)
  })

  it('adds stock appreciation on top of ESPP discount gain', () => {
    // $9,000 contribution → $10,000 shares; 10% stock appreciation = $1,000 extra
    const inputs = { ...ZERO_INPUTS, primaryEsppBalance: 9000, primaryEsppRate: 10 }
    const result = getInvestmentAnnualReturn(inputs, 'primary')
    // discount gain $1,000 + appreciation $1,000 = $2,000
    expect(result).toBeCloseTo(2000, 0)
  })

  it('uses the correct prefix for partner accounts', () => {
    const inputs = { ...ZERO_INPUTS, partnerHysaBalance: 5000, partnerHysaRate: 4 }
    expect(getInvestmentAnnualReturn(inputs, 'partner')).toBe(200)
    expect(getInvestmentAnnualReturn(inputs, 'primary')).toBe(0)
  })
})

describe('calculateScenario', () => {
  it('returns a scenario with the correct shape', () => {
    const scenario = calculateScenario(120000, GROSS_INPUTS)
    expect(scenario).toHaveProperty('grossMonthlyIncome')
    expect(scenario).toHaveProperty('effectiveMonthlyIncome')
    expect(scenario).toHaveProperty('isNet')
    expect(scenario).toHaveProperty('adjustedHousingBudget')
    expect(scenario).toHaveProperty('options')
    expect(scenario).toHaveProperty('recommendedOption')
    expect(scenario.options).toHaveLength(4)
  })

  it('grossMonthlyIncome is always annualIncome / 12 regardless of mode', () => {
    const gross = calculateScenario(120000, GROSS_INPUTS)
    const net   = calculateScenario(120000, NET_INPUTS)
    expect(gross.grossMonthlyIncome).toBe(10000)
    expect(net.grossMonthlyIncome).toBe(10000)
  })

  it('effectiveMonthlyIncome equals grossMonthlyIncome in lender mode', () => {
    const scenario = calculateScenario(120000, GROSS_INPUTS)
    expect(scenario.isNet).toBe(false)
    expect(scenario.effectiveMonthlyIncome).toBe(scenario.grossMonthlyIncome)
  })

  it('effectiveMonthlyIncome is reduced by tax rate in affordability mode', () => {
    const scenario = calculateScenario(120000, NET_INPUTS)
    expect(scenario.isNet).toBe(true)
    // $120,000 * (1 - 0.30) / 12 = $7,000
    expect(scenario.effectiveMonthlyIncome).toBeCloseTo(7000, 1)
  })

  it('affordability mode produces a lower housing budget than lender mode', () => {
    const gross = calculateScenario(120000, GROSS_INPUTS)
    const net   = calculateScenario(120000, NET_INPUTS)
    expect(net.adjustedHousingBudget).toBeLessThan(gross.adjustedHousingBudget)
  })

  it('401k deduction reduces effective take-home in affordability mode', () => {
    const without401k = calculateScenario(120000, NET_INPUTS, 0)
    const with401k    = calculateScenario(120000, NET_INPUTS, 23500)
    expect(with401k.effectiveMonthlyIncome).toBeLessThan(without401k.effectiveMonthlyIncome)
    expect(with401k.adjustedHousingBudget).toBeLessThan(without401k.adjustedHousingBudget)
  })

  it('401k deduction has no effect in lender mode', () => {
    const without401k = calculateScenario(120000, GROSS_INPUTS, 0)
    const with401k    = calculateScenario(120000, GROSS_INPUTS, 23500)
    expect(with401k.effectiveMonthlyIncome).toBe(without401k.effectiveMonthlyIncome)
    expect(with401k.adjustedHousingBudget).toBe(without401k.adjustedHousingBudget)
  })

  // Investment returns are excluded from the income passed to calculateScenario in
  // lender mode (handled in App.jsx). These two tests document that contract:
  it('identical incomes produce identical results regardless of mode (calculateScenario is pure)', () => {
    const gross = calculateScenario(120000, GROSS_INPUTS)
    const net   = calculateScenario(120000, NET_INPUTS)
    // Same gross income → same grossMonthlyIncome; modes only differ in effectiveMonthlyIncome
    expect(gross.grossMonthlyIncome).toBe(net.grossMonthlyIncome)
  })

  it('adding investment returns to income increases lender mode home price', () => {
    // App.jsx passes salary-only income in lender mode and salary+returns in affordability.
    // This test confirms calculateScenario responds correctly to higher income input.
    const salaryOnly      = calculateScenario(120000, GROSS_INPUTS)
    const salaryPlusReturns = calculateScenario(135000, GROSS_INPUTS) // simulates added investment income
    expect(salaryPlusReturns.recommendedOption.homePrice).toBeGreaterThan(salaryOnly.recommendedOption.homePrice)
  })

  it('home prices are positive for a reasonable income', () => {
    const scenario = calculateScenario(120000, GROSS_INPUTS)
    scenario.options.forEach((option) => {
      expect(option.homePrice).toBeGreaterThan(0)
    })
  })

  it('higher income produces a higher max home price', () => {
    const low  = calculateScenario(80000,  GROSS_INPUTS)
    const high = calculateScenario(160000, GROSS_INPUTS)
    expect(high.recommendedOption.homePrice).toBeGreaterThan(low.recommendedOption.homePrice)
  })

  it('returns zero home prices when income cannot cover fixed costs', () => {
    const brokeInputs = { ...GROSS_INPUTS, monthlyHoa: 99999, monthlyInsurance: 99999 }
    const scenario = calculateScenario(10000, brokeInputs)
    scenario.options.forEach((option) => {
      expect(option.homePrice).toBe(0)
    })
  })
})

describe('getWeightedReturnRate', () => {
  it('falls back to stocks rate when all balances are zero', () => {
    const inputs = { ...ZERO_INPUTS, primaryStocksRate: 7 }
    expect(getWeightedReturnRate(inputs, 'primary')).toBe(7)
  })

  it('returns the single account rate when only one account has a balance', () => {
    const inputs = { ...ZERO_INPUTS, primaryHysaBalance: 50000, primaryHysaRate: 5 }
    expect(getWeightedReturnRate(inputs, 'primary')).toBeCloseTo(5, 5)
  })

  it('returns weighted average across multiple accounts', () => {
    const inputs = {
      ...ZERO_INPUTS,
      primaryHysaBalance: 100000, primaryHysaRate: 5,
      primaryStocksBalance: 100000, primaryStocksRate: 9,
    }
    // Weighted avg = (100k*5 + 100k*9) / 200k = 7
    expect(getWeightedReturnRate(inputs, 'primary')).toBeCloseTo(7, 5)
  })

  it('weights proportionally when balances are unequal', () => {
    const inputs = {
      ...ZERO_INPUTS,
      primaryHysaBalance: 25000, primaryHysaRate: 4,
      primaryStocksBalance: 75000, primaryStocksRate: 8,
    }
    // (25k*4 + 75k*8) / 100k = 7
    expect(getWeightedReturnRate(inputs, 'primary')).toBeCloseTo(7, 5)
  })

  it('uses ESPP effective rate (discount + appreciation) in weighting', () => {
    const inputs = { ...ZERO_INPUTS, primaryEsppBalance: 9000, primaryEsppRate: 0 }
    const rate = getWeightedReturnRate(inputs, 'primary')
    expect(rate).toBeCloseTo(11.11, 1)
  })

  it('uses the correct prefix — partner balances do not affect primary rate', () => {
    const inputs = {
      ...ZERO_INPUTS,
      partnerHysaBalance: 100000, partnerHysaRate: 5,
      primaryStocksRate: 7,
    }
    expect(getWeightedReturnRate(inputs, 'primary')).toBe(7)
    expect(getWeightedReturnRate(inputs, 'partner')).toBeCloseTo(5, 5)
  })
})

describe('getRequiredDownPayment', () => {
  const ZERO_PARAMS = { annualRate: 0, propertyTaxRate: 0, monthlyHoa: 0, monthlyInsurance: 0 }

  it('returns 0 when budget can fully service the loan with no down payment', () => {
    // maxLoan = 3000 * 360 = 1,080,000 > 500,000 → no down needed
    expect(getRequiredDownPayment(500000, 3000, ZERO_PARAMS)).toBe(0)
  })

  it('returns homePrice - maxLoan when budget cannot cover the full price', () => {
    // maxLoan = 2000 * 360 = 720,000; requiredDown = 1,000,000 - 720,000 = 280,000
    expect(getRequiredDownPayment(1000000, 2000, ZERO_PARAMS)).toBeCloseTo(280000, 0)
  })

  it('returns homePrice when budget cannot cover any payment (fixed costs exceed budget)', () => {
    const params = { annualRate: 0, propertyTaxRate: 0, monthlyHoa: 5000, monthlyInsurance: 0 }
    expect(getRequiredDownPayment(500000, 3000, params)).toBe(500000)
  })

  it('higher monthly budget requires less down payment', () => {
    const low  = getRequiredDownPayment(800000, 2000, ZERO_PARAMS)
    const high = getRequiredDownPayment(800000, 3000, ZERO_PARAMS)
    expect(high).toBeLessThan(low)
  })

  it('property tax increases required down payment', () => {
    // homePrice 1M, budget 2500: without tax maxLoan=900k→down=100k; with 1% tax, less goes to P&I→higher down
    const noTax   = getRequiredDownPayment(1000000, 2500, ZERO_PARAMS)
    const withTax = getRequiredDownPayment(1000000, 2500, { ...ZERO_PARAMS, propertyTaxRate: 1 })
    expect(withTax).toBeGreaterThan(noTax)
  })
})

describe('projectMarketRace', () => {
  // Use 0% mortgage rate and no fixed costs so requiredDown math is simple:
  // maxLoan = monthlyHousingBudget * 360, requiredDown = max(homePrice - maxLoan, 0)
  const MORTGAGE_PARAMS = { annualRate: 0, propertyTaxRate: 0, monthlyHoa: 0, monthlyInsurance: 0 }
  const BASE = {
    currentPortfolio: 200000,
    portfolioReturnRate: 7,
    annualContribution: 0,
    targetHomePrice: 1000000,
    housingAppreciationRate: 5,
    monthlyHousingBudget: 2000,  // maxLoan = 720k → requiredDown = 280k
    mortgageParams: MORTGAGE_PARAMS,
    years: 10,
  }

  it('returns years + 1 entries (year 0 through year N)', () => {
    const result = projectMarketRace(BASE)
    expect(result).toHaveLength(11)
    expect(result[0].year).toBe(0)
    expect(result[10].year).toBe(10)
  })

  it('year 0 has the exact current portfolio and home price', () => {
    const result = projectMarketRace(BASE)
    expect(result[0].portfolio).toBe(200000)
    expect(result[0].homePrice).toBe(1000000)
    // requiredDown = 1,000,000 - (2000 * 360) = 280,000
    expect(result[0].requiredDown).toBeCloseTo(280000, 0)
  })

  it('portfolio compounds at the portfolio return rate', () => {
    const result = projectMarketRace({ ...BASE, annualContribution: 0 })
    expect(result[1].portfolio).toBeCloseTo(200000 * 1.07, 0)
    expect(result[10].portfolio).toBeCloseTo(200000 * Math.pow(1.07, 10), 0)
  })

  it('home price compounds at the housing appreciation rate', () => {
    const result = projectMarketRace(BASE)
    expect(result[1].homePrice).toBeCloseTo(1000000 * 1.05, 0)
    expect(result[10].homePrice).toBeCloseTo(1000000 * Math.pow(1.05, 10), 0)
  })

  it('requiredDown grows as home price appreciates', () => {
    const result = projectMarketRace(BASE)
    // requiredDown = homePrice - 720k; as homePrice grows, so does requiredDown
    expect(result[10].requiredDown).toBeGreaterThan(result[0].requiredDown)
  })

  it('gap is negative when portfolio exceeds required down', () => {
    // Portfolio 500k >> requiredDown ~280k → already affordable
    const result = projectMarketRace({ ...BASE, currentPortfolio: 500000 })
    expect(result[0].gap).toBeLessThanOrEqual(0)
  })

  it('requiredDown is 0 when budget can cover full home price with no down payment', () => {
    // monthlyHousingBudget = 5000 → maxLoan = 1,800,000 > homePrice → no down needed
    const result = projectMarketRace({ ...BASE, monthlyHousingBudget: 5000 })
    expect(result[0].requiredDown).toBe(0)
  })

  it('annual contributions accelerate portfolio growth', () => {
    const noContrib = projectMarketRace({ ...BASE, annualContribution: 0 })
    const withContrib = projectMarketRace({ ...BASE, annualContribution: 50000 })
    expect(withContrib[10].portfolio).toBeGreaterThan(noContrib[10].portfolio)
  })

  it('handles zero portfolio return rate with linear contribution growth', () => {
    const result = projectMarketRace({
      ...BASE,
      currentPortfolio: 0,
      portfolioReturnRate: 0,
      annualContribution: 10000,
    })
    expect(result[5].portfolio).toBeCloseTo(50000, 0)
    expect(result[10].portfolio).toBeCloseTo(100000, 0)
  })

  it('gap equals requiredDown minus portfolio', () => {
    const result = projectMarketRace(BASE)
    result.forEach(({ gap, requiredDown, portfolio }) => {
      expect(gap).toBeCloseTo(requiredDown - portfolio, 0)
    })
  })
})
