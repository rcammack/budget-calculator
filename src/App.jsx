import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { calculateScenario, getAnnualPassive, percent, toNumber } from './calculations'
import { CREDIT_SCORE_OPTIONS, DEFAULT_INPUTS, STORAGE_KEY } from './constants'
import FrequencyInput from './components/FrequencyInput'
import NumberInput from './components/NumberInput'
import ScenarioCard from './components/ScenarioCard'

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
