import { CREDIT_SCORE_OPTIONS, DOWN_PAYMENT_OPTIONS, INVESTMENT_ACCOUNTS, ESPP_DISCOUNT } from './constants'

export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export const percent = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

export const toNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(number, 0) : 0
}

export const getAnnualPassive = (amount, frequency) =>
  frequency === 'monthly' ? toNumber(amount) * 12 : toNumber(amount)

export const getInvestmentAnnualReturn = (inputs, prefix) =>
  INVESTMENT_ACCOUNTS.reduce((total, { key, type }) => {
    const balance = toNumber(inputs[`${prefix}${key}Balance`])
    const rate = toNumber(inputs[`${prefix}${key}Rate`])
    if (type === 'espp') {
      // contribution buys stock at a discount; gain = discount benefit + stock appreciation on shares received
      const sharesValue = balance / (1 - ESPP_DISCOUNT)
      const discountGain = sharesValue - balance
      const appreciationGain = sharesValue * (rate / 100)
      return total + discountGain + appreciationGain
    }
    return total + balance * (rate / 100)
  }, 0)

// Weighted average annual return rate across all investment accounts for a given prefix.
// Falls back to the stocks rate if total balance is zero.
export const getWeightedReturnRate = (inputs, prefix) => {
  const totalBalance = INVESTMENT_ACCOUNTS.reduce(
    (sum, { key }) => sum + toNumber(inputs[`${prefix}${key}Balance`]),
    0,
  )
  if (!totalBalance) return toNumber(inputs[`${prefix}StocksRate`])

  const weightedSum = INVESTMENT_ACCOUNTS.reduce((sum, { key, type }) => {
    const balance = toNumber(inputs[`${prefix}${key}Balance`])
    if (!balance) return sum
    const rate = toNumber(inputs[`${prefix}${key}Rate`])
    if (type === 'espp') {
      const sharesValue = balance / (1 - ESPP_DISCOUNT)
      const effectiveRate = ((sharesValue - balance + sharesValue * (rate / 100)) / balance) * 100
      return sum + balance * effectiveRate
    }
    return sum + balance * rate
  }, 0)

  return weightedSum / totalBalance
}

// Project portfolio value and required 20% down payment year by year.
export const projectMarketRace = ({
  currentPortfolio,
  portfolioReturnRate,
  annualContribution,
  targetHomePrice,
  housingAppreciationRate,
  years = 10,
}) => {
  const r = portfolioReturnRate / 100
  const h = housingAppreciationRate / 100

  return Array.from({ length: years + 1 }, (_, year) => {
    const portfolio =
      currentPortfolio * Math.pow(1 + r, year) +
      (r > 0
        ? annualContribution * ((Math.pow(1 + r, year) - 1) / r)
        : annualContribution * year)
    const homePrice = targetHomePrice * Math.pow(1 + h, year)
    const downPaymentNeeded = homePrice * 0.2
    return { year, portfolio, homePrice, downPaymentNeeded, gap: downPaymentNeeded - portfolio }
  })
}

const getMonthlyPrincipalAndInterest = (loanAmount, annualRate) => {
  const principal = toNumber(loanAmount)
  if (!principal) return 0

  const monthlyRate = toNumber(annualRate) / 100 / 12
  const term = 30 * 12

  if (!monthlyRate) return principal / term

  const growth = Math.pow(1 + monthlyRate, term)
  return (principal * monthlyRate * growth) / (growth - 1)
}

const getMaxHomePrice = ({
  housingBudget,
  downPaymentRate,
  annualRate,
  propertyTaxRate,
  monthlyHoa,
  monthlyInsurance,
}) => {
  const monthlyRate = toNumber(annualRate) / 100 / 12
  const term = 30 * 12
  const fixedCosts = toNumber(monthlyHoa) + toNumber(monthlyInsurance)

  const paymentCapacity = Math.max(housingBudget - fixedCosts, 0)
  if (!paymentCapacity) return 0

  const loanPerDollarPayment = monthlyRate
    ? (1 - Math.pow(1 + monthlyRate, -term)) / monthlyRate
    : term

  const principalPerDollarHome = (1 - downPaymentRate) / loanPerDollarPayment
  const taxPerDollarHome = toNumber(propertyTaxRate) / 100 / 12
  const monthlyCostPerDollarHome = principalPerDollarHome + taxPerDollarHome

  if (!monthlyCostPerDollarHome) return 0

  return paymentCapacity / monthlyCostPerDollarHome
}

export const calculateScenario = (annualIncome, inputs, annualPreTaxDeductions = 0) => {
  const isNet = inputs.incomeMode === 'net'
  const taxFactor = isNet ? 1 - Math.min(toNumber(inputs.effectiveTaxRate), 60) / 100 : 1
  // 401k contributions are pre-tax: subtract after applying tax factor (conservative simplification)
  const effectiveAnnualIncome = annualIncome * taxFactor - (isNet ? toNumber(annualPreTaxDeductions) : 0)
  const creditBand =
    CREDIT_SCORE_OPTIONS.find((option) => option.value === inputs.creditBand) ||
    CREDIT_SCORE_OPTIONS[4]

  const grossMonthlyIncome = annualIncome / 12
  const effectiveMonthlyIncome = effectiveAnnualIncome / 12
  const colAdjustmentFactor = 1 - Math.min(toNumber(inputs.costOfLivingAdjustment), 40) / 100

  let baseHousingBudget
  if (isNet) {
    // 25% of take-home — personal finance rule for not becoming house poor
    // COL adjustment trims further since non-housing expenses are ~10% higher in Hawaii
    baseHousingBudget = effectiveMonthlyIncome * 0.25 * colAdjustmentFactor
  } else {
    // Standard lender 28/36 rule on gross — lenders don't apply a COL haircut
    const frontEndCap = grossMonthlyIncome * 0.28
    const backEndCap = grossMonthlyIncome * 0.36 - toNumber(inputs.monthlyDebts)
    baseHousingBudget = Math.max(Math.min(frontEndCap, backEndCap), 0)
  }
  const adjustedHousingBudget = baseHousingBudget * creditBand.factor

  const options = DOWN_PAYMENT_OPTIONS.map((downPercent) => {
    const downPaymentRate = downPercent / 100
    const homePrice = getMaxHomePrice({
      housingBudget: adjustedHousingBudget,
      downPaymentRate,
      annualRate: inputs.mortgageRate,
      propertyTaxRate: inputs.propertyTaxRate,
      monthlyHoa: inputs.monthlyHoa,
      monthlyInsurance: inputs.monthlyInsurance,
    })

    const loanAmount = homePrice * (1 - downPaymentRate)
    const monthlyPrincipalAndInterest = getMonthlyPrincipalAndInterest(
      loanAmount,
      inputs.mortgageRate,
    )
    const monthlyTax = (homePrice * toNumber(inputs.propertyTaxRate)) / 100 / 12
    const monthlyTotalHousing =
      monthlyPrincipalAndInterest +
      monthlyTax +
      toNumber(inputs.monthlyHoa) +
      toNumber(inputs.monthlyInsurance)

    return {
      downPercent,
      homePrice,
      loanAmount,
      downPaymentNeeded: homePrice * downPaymentRate,
      monthlyPrincipalAndInterest,
      monthlyTotalHousing,
    remainingMonthlyBudget: Math.max(effectiveMonthlyIncome - monthlyTotalHousing, 0),
    }
  })

  const recommendedOption =
    options.find((option) => option.downPercent === creditBand.recommendedDown) || options[2]

  return {
    grossMonthlyIncome,
    effectiveMonthlyIncome,
    isNet,
    annualIncome,
    adjustedHousingBudget,
    creditBand,
    options,
    recommendedOption,
  }
}
