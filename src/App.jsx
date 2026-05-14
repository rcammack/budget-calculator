import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'home-affordability-calculator-inputs-v1'
const DOWN_PAYMENT_OPTIONS = [3.5, 5, 10, 20]
const CREDIT_SCORE_OPTIONS = [
  { value: 'lt580', label: '<580', factor: 0.78, recommendedDown: 10 },
  { value: '580-619', label: '580-619', factor: 0.85, recommendedDown: 5 },
  { value: '620-659', label: '620-659', factor: 0.92, recommendedDown: 5 },
  { value: '660-719', label: '660-719', factor: 1, recommendedDown: 10 },
  { value: '720-759', label: '720-759', factor: 1.05, recommendedDown: 10 },
  { value: '760plus', label: '760+', factor: 1.1, recommendedDown: 20 },
]

const DEFAULT_INPUTS = {
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

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const percent = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

const toNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(number, 0) : 0
}

const getAnnualPassive = (amount, frequency) =>
  frequency === 'monthly' ? toNumber(amount) * 12 : toNumber(amount)

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
  if (!paymentCapacity) {
    return 0
  }

  const loanPerDollarPayment = monthlyRate
    ? (1 - Math.pow(1 + monthlyRate, -term)) / monthlyRate
    : term

  const principalPerDollarHome = (1 - downPaymentRate) / loanPerDollarPayment
  const taxPerDollarHome = toNumber(propertyTaxRate) / 100 / 12
  const monthlyCostPerDollarHome = principalPerDollarHome + taxPerDollarHome

  if (!monthlyCostPerDollarHome) {
    return 0
  }

  return paymentCapacity / monthlyCostPerDollarHome
}

const calculateScenario = (annualIncome, inputs) => {
  const creditBand =
    CREDIT_SCORE_OPTIONS.find((option) => option.value === inputs.creditBand) ||
    CREDIT_SCORE_OPTIONS[4]

  const grossMonthlyIncome = annualIncome / 12
  const frontEndCap = grossMonthlyIncome * 0.28
  const backEndCap = grossMonthlyIncome * 0.36 - toNumber(inputs.monthlyDebts)
  const baseHousingBudget = Math.max(Math.min(frontEndCap, backEndCap), 0)
  const colAdjustmentFactor =
    1 - Math.min(toNumber(inputs.costOfLivingAdjustment), 40) / 100

  const adjustedHousingBudget = baseHousingBudget * creditBand.factor * colAdjustmentFactor

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
      remainingMonthlyBudget: Math.max(grossMonthlyIncome - monthlyTotalHousing, 0),
    }
  })

  const recommendedOption =
    options.find((option) => option.downPercent === creditBand.recommendedDown) || options[2]

  return {
    grossMonthlyIncome,
    annualIncome,
    adjustedHousingBudget,
    creditBand,
    options,
    recommendedOption,
  }
}

const NumberInput = ({ label, value, onChange, hint, step = 'any' }) => (
  <label className="field">
    <span>{label}</span>
    <input
      type="number"
      inputMode="decimal"
      min="0"
      step={step}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
    {hint && <small>{hint}</small>}
  </label>
)

const FrequencyInput = ({ label, amount, frequency, onAmountChange, onFrequencyChange }) => (
  <div className="field-group">
    <NumberInput label={label} value={amount} onChange={onAmountChange} />
    <label className="field">
      <span>Frequency</span>
      <select value={frequency} onChange={(event) => onFrequencyChange(event.target.value)}>
        <option value="monthly">Monthly</option>
        <option value="annual">Annual</option>
      </select>
    </label>
  </div>
)

const ScenarioCard = ({ title, scenario }) => {
  if (!scenario) return null

  return (
    <article className="result-card">
      <header>
        <h3>{title}</h3>
        <p>
          Gross monthly income: <strong>{currency.format(scenario.grossMonthlyIncome)}</strong>
        </p>
      </header>

      <p className="summary-line">
        Maximum housing budget: <strong>{currency.format(scenario.adjustedHousingBudget)}</strong>
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Down</th>
              <th>Max Home Price</th>
              <th>Loan Amount</th>
              <th>Monthly Mortgage</th>
              <th>Down Payment</th>
            </tr>
          </thead>
          <tbody>
            {scenario.options.map((option) => (
              <tr
                key={option.downPercent}
                className={
                  option.downPercent === scenario.recommendedOption.downPercent ? 'recommended' : ''
                }
              >
                <td>{option.downPercent}%</td>
                <td>{currency.format(option.homePrice)}</td>
                <td>{currency.format(option.loanAmount)}</td>
                <td>{currency.format(option.monthlyTotalHousing)}</td>
                <td>{currency.format(option.downPaymentNeeded)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        Recommended down payment: <strong>{scenario.recommendedOption.downPercent}%</strong> (
        {currency.format(scenario.recommendedOption.downPaymentNeeded)})
      </p>
      <p>
        Remaining monthly budget after housing:{' '}
        <strong>{currency.format(scenario.recommendedOption.remainingMonthlyBudget)}</strong>
      </p>
    </article>
  )
}

function App() {
  const [inputs, setInputs] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_INPUTS
    }

    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      return { ...DEFAULT_INPUTS, ...parsed }
    } catch {
      return DEFAULT_INPUTS
    }
  })

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', saved)
    return saved
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs))
  }, [inputs])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const update = (field) => (value) => {
    setInputs((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const primaryAnnualIncome =
    toNumber(inputs.primarySalary) +
    getAnnualPassive(inputs.primaryPassive, inputs.primaryPassiveFrequency)

  const partnerAnnualIncome =
    toNumber(inputs.partnerSalary) +
    getAnnualPassive(inputs.partnerPassive, inputs.partnerPassiveFrequency)

  const soloScenario = useMemo(
    () => calculateScenario(primaryAnnualIncome, inputs),
    [primaryAnnualIncome, inputs],
  )

  const combinedScenario = useMemo(
    () =>
      inputs.includePartner
        ? calculateScenario(primaryAnnualIncome + partnerAnnualIncome, inputs)
        : null,
    [inputs, partnerAnnualIncome, primaryAnnualIncome],
  )

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header-top">
          <p className="eyebrow">Honolulu, HI</p>
          <label className="theme-switcher">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              aria-label="Color theme"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="hc">High Contrast</option>
            </select>
          </label>
        </div>
        <h1>Home Affordability Calculator</h1>
        <p>
          Estimates use the 28/36 rule with Honolulu defaults for property tax ({percent.format(
            toNumber(inputs.propertyTaxRate),
          )}
          %), HOA, insurance, and cost-of-living adjustment.
        </p>
      </header>

      <section className="panel">
        <h2>Income Inputs</h2>
        <div className="grid two-col">
          <NumberInput
            label="Primary annual salary"
            value={inputs.primarySalary}
            onChange={update('primarySalary')}
          />
          <FrequencyInput
            label="Primary passive income"
            amount={inputs.primaryPassive}
            frequency={inputs.primaryPassiveFrequency}
            onAmountChange={update('primaryPassive')}
            onFrequencyChange={update('primaryPassiveFrequency')}
          />
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={inputs.includePartner}
            onChange={(event) => update('includePartner')(event.target.checked)}
          />
          <span>Add partner income</span>
        </label>

        {inputs.includePartner && (
          <div className="grid two-col partner-grid">
            <NumberInput
              label="Partner annual salary"
              value={inputs.partnerSalary}
              onChange={update('partnerSalary')}
            />
            <FrequencyInput
              label="Partner passive income"
              amount={inputs.partnerPassive}
              frequency={inputs.partnerPassiveFrequency}
              onAmountChange={update('partnerPassive')}
              onFrequencyChange={update('partnerPassiveFrequency')}
            />
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Affordability Inputs</h2>
        <div className="grid three-col">
          <label className="field">
            <span>Credit score range</span>
            <select value={inputs.creditBand} onChange={(event) => update('creditBand')(event.target.value)}>
              {CREDIT_SCORE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <NumberInput
            label="Mortgage rate (%)"
            value={inputs.mortgageRate}
            onChange={update('mortgageRate')}
            step="0.01"
            hint="Default set to current HI average"
          />
          <NumberInput
            label="Monthly non-housing debt"
            value={inputs.monthlyDebts}
            onChange={update('monthlyDebts')}
          />
          <NumberInput
            label="Monthly HOA"
            value={inputs.monthlyHoa}
            onChange={update('monthlyHoa')}
          />
          <NumberInput
            label="Monthly home insurance"
            value={inputs.monthlyInsurance}
            onChange={update('monthlyInsurance')}
          />
          <NumberInput
            label="Property tax rate (%)"
            value={inputs.propertyTaxRate}
            onChange={update('propertyTaxRate')}
            step="0.01"
            hint="Honolulu average is ~0.28%"
          />
          <NumberInput
            label="High cost-of-living adjustment (%)"
            value={inputs.costOfLivingAdjustment}
            onChange={update('costOfLivingAdjustment')}
            step="0.1"
            hint="Applied as a housing budget reduction"
          />
        </div>
      </section>

      <section className="results-grid" aria-live="polite">
        <ScenarioCard title="Solo Income" scenario={soloScenario} />
        {inputs.includePartner && (
          <ScenarioCard title="Combined Income" scenario={combinedScenario} />
        )}
      </section>
    </main>
  )
}

export default App
