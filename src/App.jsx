import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { calculateScenario, currency, getAnnualPassive, getInvestmentAnnualReturn, getWeightedReturnRate, toNumber } from './calculations'
import { CREDIT_SCORE_OPTIONS, DEFAULT_INPUTS, INVESTMENT_ACCOUNTS, MAX_401K_CONTRIBUTION, STORAGE_KEY, TAX_RATE_MARRIED, TAX_RATE_SINGLE } from './constants'
import FrequencyInput from './components/FrequencyInput'
import InvestmentInputs from './components/InvestmentInputs'
import NumberInput from './components/NumberInput'
import DownPaymentAdvice from './components/DownPaymentAdvice'
import MarketRace from './components/MarketRace'
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
    fetch(`${import.meta.env.BASE_URL}market-data.json`)
      .then((res) => res.json())
      .then((data) => {
        setInputs((prev) => {
          const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
          const marketFields = ['mortgageRate', 'monthlyHoa', 'monthlyInsurance', 'propertyTaxRate', 'costOfLivingAdjustment', 'housingAppreciationRate']
          const updates = {}
          for (const field of marketFields) {
            if (data[field] !== undefined && stored[field] === undefined) {
              updates[field] = data[field]
            }
          }
          return Object.keys(updates).length ? { ...prev, ...updates } : prev
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs))
  }, [inputs])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Auto-suggest tax rate based on filing status, unless user has customized it
  useEffect(() => {
    setInputs((prev) => {
      const suggested = prev.includePartner ? TAX_RATE_MARRIED : TAX_RATE_SINGLE
      const otherSuggested = prev.includePartner ? TAX_RATE_SINGLE : TAX_RATE_MARRIED
      const isStillSuggested = toNumber(prev.effectiveTaxRate) === otherSuggested
      if (!isStillSuggested) return prev
      return { ...prev, effectiveTaxRate: suggested }
    })
  }, [inputs.includePartner])

  const [showPrimaryInvestments, setShowPrimaryInvestments] = useState(false)
  const [showPartnerInvestments, setShowPartnerInvestments] = useState(false)

  const update = (field) => (value) => {
    setInputs((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const primaryAnnualIncome =
    toNumber(inputs.primarySalary) +
    getAnnualPassive(inputs.primaryPassive, inputs.primaryPassiveFrequency) +
    (inputs.incomeMode === 'net' ? getInvestmentAnnualReturn(inputs, 'primary') : 0)

  const partnerAnnualIncome =
    toNumber(inputs.partnerSalary) +
    getAnnualPassive(inputs.partnerPassive, inputs.partnerPassiveFrequency) +
    (inputs.incomeMode === 'net' ? getInvestmentAnnualReturn(inputs, 'partner') : 0)

  const primary401kDeduction = toNumber(inputs.primary401kContribution)
  const partner401kDeduction = toNumber(inputs.partner401kContribution)

  // Liquid savings available for a down payment (HYSA + Stocks + Savings balances)
  const primaryLiquidSavings =
    toNumber(inputs.primaryHysaBalance) +
    toNumber(inputs.primaryStocksBalance) +
    toNumber(inputs.primarySavingsBalance)
  const partnerLiquidSavings = inputs.includePartner
    ? toNumber(inputs.partnerHysaBalance) +
      toNumber(inputs.partnerStocksBalance) +
      toNumber(inputs.partnerSavingsBalance)
    : 0
  const totalLiquidSavings = primaryLiquidSavings + partnerLiquidSavings

  // Total portfolio across ALL investment accounts (including CDs, ESPP) for market race
  const primaryPortfolioBalance = INVESTMENT_ACCOUNTS.reduce(
    (sum, { key }) => sum + toNumber(inputs[`primary${key}Balance`]), 0,
  )
  const partnerPortfolioBalance = inputs.includePartner
    ? INVESTMENT_ACCOUNTS.reduce((sum, { key }) => sum + toNumber(inputs[`partner${key}Balance`]), 0)
    : 0
  const totalPortfolio = primaryPortfolioBalance + partnerPortfolioBalance

  // Weighted return rate combined across primary (and partner if included)
  const primaryReturnRate = getWeightedReturnRate(inputs, 'primary')
  const partnerReturnRate = getWeightedReturnRate(inputs, 'partner')
  const portfolioReturnRate =
    totalPortfolio > 0
      ? (primaryReturnRate * primaryPortfolioBalance + (inputs.includePartner ? partnerReturnRate * partnerPortfolioBalance : 0)) / totalPortfolio
      : primaryReturnRate

  const soloScenario = useMemo(
    () => calculateScenario(primaryAnnualIncome, inputs, primary401kDeduction),
    [primaryAnnualIncome, inputs, primary401kDeduction],
  )

  const combinedScenario = useMemo(
    () =>
      inputs.includePartner
        ? calculateScenario(primaryAnnualIncome + partnerAnnualIncome, inputs, primary401kDeduction + partner401kDeduction)
        : null,
    [inputs, partnerAnnualIncome, primaryAnnualIncome, primary401kDeduction, partner401kDeduction],
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
          Honolulu-focused affordability calculator. Affordability mode uses 25% of net
          take-home; Lender mode uses the 28/36 rule on gross income. Defaults reflect
          Honolulu market rates for HOA, insurance, property tax, and cost of living.
        </p>
      </header>

      <section className="panel">
        <div className="panel-header-row">
          <h2>Income Inputs</h2>
          <div className="mode-toggle" role="group" aria-label="Calculation mode">
            <button
              className={`mode-btn${inputs.incomeMode === 'net' ? ' active' : ''}`}
              onClick={() => update('incomeMode')('net')}
            >
              Affordability
            </button>
            <button
              className={`mode-btn${inputs.incomeMode === 'gross' ? ' active' : ''}`}
              onClick={() => update('incomeMode')('gross')}
            >
              Lender
            </button>
          </div>
        </div>

        {inputs.incomeMode === 'net' && (
          <div className="tax-rate-row">
            <NumberInput
              label="Effective tax rate (%)"
              value={inputs.effectiveTaxRate}
              onChange={update('effectiveTaxRate')}
              step="0.1"
              hint="Federal + Hawaii state + FICA. ~30% is typical for Hawaii."
            />
          </div>
        )}

        {inputs.incomeMode === 'gross' && (
          <p className="mode-note">
            Uses 28/36 rule on gross income. Counts salary and passive income only —
            investment returns are excluded as lenders require a 2-year documented history.
          </p>
        )}

        {/* Primary person block */}
        <div className="person-block">
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

          <div className="retirement-section">
            <div className="retirement-row">
              <span className="retirement-label">401(k)</span>
              <NumberInput
                label="Employee contribution ($/yr)"
                value={inputs.primary401kContribution}
                onChange={update('primary401kContribution')}
                hint={`2025 max: $${MAX_401K_CONTRIBUTION.toLocaleString()}`}
              />
              <NumberInput
                label="Employer match (%)"
                value={inputs.primary401kMatchPercent}
                onChange={update('primary401kMatchPercent')}
                step="1"
              />
              <span className="retirement-match">
                Employer adds{' '}
                <strong>
                  {currency.format(
                    Math.min(
                      toNumber(inputs.primary401kContribution) * (toNumber(inputs.primary401kMatchPercent) / 100),
                      toNumber(inputs.primarySalary) * 0.06,
                    ),
                  )}
                  /yr
                </strong>
              </span>
            </div>
          </div>

          <div className="investment-toggle-row">
            <button
              className="toggle-btn"
              onClick={() => setShowPrimaryInvestments((v) => !v)}
              aria-expanded={showPrimaryInvestments}
            >
              {showPrimaryInvestments ? '▾' : '▸'} Investment Accounts
            </button>
          </div>

          {showPrimaryInvestments && (
            <div className="investment-section">
              <InvestmentInputs prefix="primary" inputs={inputs} update={update} />
            </div>
          )}
        </div>

        {/* Partner toggle at the bottom */}
        <label className="toggle partner-toggle">
          <input
            type="checkbox"
            checked={inputs.includePartner}
            onChange={(event) => update('includePartner')(event.target.checked)}
          />
          <span>Add partner income</span>
        </label>

        {inputs.includePartner && (
          <div className="person-block partner-block">
            <div className="grid two-col">
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

            <div className="retirement-section">
              <div className="retirement-row">
                <span className="retirement-label">401(k)</span>
                <NumberInput
                  label="Employee contribution ($/yr)"
                  value={inputs.partner401kContribution}
                  onChange={update('partner401kContribution')}
                  hint={`2025 max: $${MAX_401K_CONTRIBUTION.toLocaleString()}`}
                />
                <NumberInput
                  label="Employer match (%)"
                  value={inputs.partner401kMatchPercent}
                  onChange={update('partner401kMatchPercent')}
                  step="1"
                />
                <span className="retirement-match">
                  Employer adds{' '}
                  <strong>
                    {currency.format(
                      Math.min(
                        toNumber(inputs.partner401kContribution) * (toNumber(inputs.partner401kMatchPercent) / 100),
                        toNumber(inputs.partnerSalary) * 0.06,
                      ),
                    )}
                    /yr
                  </strong>
                </span>
              </div>
            </div>

            <div className="investment-toggle-row">
              <button
                className="toggle-btn"
                onClick={() => setShowPartnerInvestments((v) => !v)}
                aria-expanded={showPartnerInvestments}
              >
                {showPartnerInvestments ? '▾' : '▸'} Investment Accounts
              </button>
            </div>

            {showPartnerInvestments && (
              <div className="investment-section">
                <InvestmentInputs prefix="partner" inputs={inputs} update={update} />
              </div>
            )}
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

      {inputs.incomeMode === 'net' && (
        <section className="panel">
          <DownPaymentAdvice
            inputs={inputs}
            recommendedHomePrice={
              (combinedScenario ?? soloScenario).recommendedOption.homePrice
            }
            liquidSavings={totalLiquidSavings}
          />
        </section>
      )}

      {inputs.incomeMode === 'net' && (
        <section className="panel">
          <MarketRace
            inputs={inputs}
            update={update}
            currentPortfolio={totalPortfolio}
            portfolioReturnRate={portfolioReturnRate}
          />
        </section>
      )}
    </main>
  )
}

export default App
