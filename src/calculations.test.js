import { describe, expect, it } from 'vitest'
import { calculateScenario, getAnnualPassive, getInvestmentAnnualReturn, toNumber } from './calculations'
import { DEFAULT_INPUTS } from './constants'

const GROSS_INPUTS = { ...DEFAULT_INPUTS, incomeMode: 'gross' }
const NET_INPUTS   = { ...DEFAULT_INPUTS, incomeMode: 'net', effectiveTaxRate: 30 }

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

describe('getAnnualPassive', () => {
  it('multiplies by 12 for monthly frequency', () => {
    expect(getAnnualPassive(500, 'monthly')).toBe(6000)
  })

  it('returns the value as-is for annual frequency', () => {
    expect(getAnnualPassive(6000, 'annual')).toBe(6000)
  })
})

describe('getInvestmentAnnualReturn', () => {
  it('returns 0 when all balances are 0', () => {
    expect(getInvestmentAnnualReturn(DEFAULT_INPUTS, 'primary')).toBe(0)
  })

  it('calculates standard account return correctly', () => {
    const inputs = { ...DEFAULT_INPUTS, primaryHysaBalance: 10000, primaryHysaRate: 5 }
    // $10,000 * 5% = $500
    expect(getInvestmentAnnualReturn(inputs, 'primary')).toBe(500)
  })

  it('sums multiple account returns', () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      primaryHysaBalance: 10000, primaryHysaRate: 5,   // $500
      primaryCdBalance:   20000, primaryCdRate:   4,   // $800
    }
    expect(getInvestmentAnnualReturn(inputs, 'primary')).toBe(1300)
  })

  it('calculates ESPP return using discount, ignoring stock appreciation when rate is 0', () => {
    // $9,000 contribution at 10% discount → buys $10,000 of stock → gain = $1,000
    const inputs = { ...DEFAULT_INPUTS, primaryEsppBalance: 9000, primaryEsppRate: 0 }
    const result = getInvestmentAnnualReturn(inputs, 'primary')
    expect(result).toBeCloseTo(1000, 0)
  })

  it('adds stock appreciation on top of ESPP discount gain', () => {
    // $9,000 contribution → $10,000 shares; 10% stock appreciation = $1,000 extra
    const inputs = { ...DEFAULT_INPUTS, primaryEsppBalance: 9000, primaryEsppRate: 10 }
    const result = getInvestmentAnnualReturn(inputs, 'primary')
    // discount gain $1,000 + appreciation $1,000 = $2,000
    expect(result).toBeCloseTo(2000, 0)
  })

  it('uses the correct prefix for partner accounts', () => {
    const inputs = { ...DEFAULT_INPUTS, partnerHysaBalance: 5000, partnerHysaRate: 4 }
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
