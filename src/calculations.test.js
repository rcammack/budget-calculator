import { describe, expect, it } from 'vitest'
import { calculateScenario, getAnnualPassive, toNumber } from './calculations'
import { DEFAULT_INPUTS } from './constants'

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

describe('calculateScenario', () => {
  it('returns a scenario with the correct shape', () => {
    const scenario = calculateScenario(120000, DEFAULT_INPUTS)
    expect(scenario).toHaveProperty('grossMonthlyIncome')
    expect(scenario).toHaveProperty('adjustedHousingBudget')
    expect(scenario).toHaveProperty('options')
    expect(scenario).toHaveProperty('recommendedOption')
    expect(scenario.options).toHaveLength(4)
  })

  it('grossMonthlyIncome is annualIncome / 12', () => {
    const scenario = calculateScenario(120000, DEFAULT_INPUTS)
    expect(scenario.grossMonthlyIncome).toBe(10000)
  })

  it('home prices are positive for a reasonable income', () => {
    const scenario = calculateScenario(120000, DEFAULT_INPUTS)
    scenario.options.forEach((option) => {
      expect(option.homePrice).toBeGreaterThan(0)
    })
  })

  it('higher income produces a higher max home price', () => {
    const low = calculateScenario(80000, DEFAULT_INPUTS)
    const high = calculateScenario(160000, DEFAULT_INPUTS)
    expect(high.recommendedOption.homePrice).toBeGreaterThan(low.recommendedOption.homePrice)
  })

  it('returns zero home prices when income cannot cover fixed costs', () => {
    const brokeInputs = { ...DEFAULT_INPUTS, monthlyHoa: 99999, monthlyInsurance: 99999 }
    const scenario = calculateScenario(10000, brokeInputs)
    scenario.options.forEach((option) => {
      expect(option.homePrice).toBe(0)
    })
  })
})
