import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { calculateScenario, currency, getAnnualIncome, getCombinedPortfolioReturnRate, getEmployerMatch, getLiquidSavings, getPortfolioBalance, toNumber } from './calculations'
import { DEFAULT_INPUTS, DEFAULT_SPENDING_ITEMS, MAX_401K_CONTRIBUTION, SPENDING_STORAGE_KEY, STORAGE_KEY, TAX_RATE_MARRIED, TAX_RATE_SINGLE } from './constants'
import FrequencyInput from './components/FrequencyInput'
import InvestmentInputs from './components/InvestmentInputs'
import NumberInput from './components/NumberInput'
import AffordabilityInputs from './components/AffordabilityInputs'
import BudgetChart from './components/BudgetChart'
import DownPaymentAdvice from './components/DownPaymentAdvice'
import MarketRace from './components/MarketRace'
import ScenarioCard from './components/ScenarioCard'
import SpendingInputs from './components/SpendingInputs'

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

  const [spendingItems, setSpendingItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SPENDING_STORAGE_KEY) || 'null')
      return saved ?? DEFAULT_SPENDING_ITEMS
    } catch {
      return DEFAULT_SPENDING_ITEMS
    }
  })

  useEffect(() => {
    localStorage.setItem(SPENDING_STORAGE_KEY, JSON.stringify(spendingItems))
  }, [spendingItems])

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

  const primaryAnnualIncome = getAnnualIncome(inputs, 'primary')
  const partnerAnnualIncome = getAnnualIncome(inputs, 'partner')

  const primary401kDeduction = toNumber(inputs.primary401kContribution)
  const partner401kDeduction = toNumber(inputs.partner401kContribution)

  const totalLiquidSavings =
    getLiquidSavings(inputs, 'primary') +
    (inputs.includePartner ? getLiquidSavings(inputs, 'partner') : 0)

  const totalPortfolio =
    getPortfolioBalance(inputs, 'primary') +
    (inputs.includePartner ? getPortfolioBalance(inputs, 'partner') : 0)

  const portfolioReturnRate = getCombinedPortfolioReturnRate(inputs)

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

  const monthlySpending = spendingItems.reduce((sum, item) => {
    const amount = item.amount || 0
    return sum + (item.frequency === 'annual' ? amount / 12 : amount)
  }, 0)

  // Rent is excluded from the chart spending slice — the housing slice already covers it
  const monthlySpendingForChart = spendingItems.reduce((sum, item) => {
    if (item.name.trim().toLowerCase() === 'rent') return sum
    const amount = item.amount || 0
    return sum + (item.frequency === 'annual' ? amount / 12 : amount)
  }, 0)

  // Monthly net take-home (post-tax, post-401k) for the active scenario
  const activeScenario = combinedScenario ?? soloScenario
  const monthlyTakeHome = activeScenario ? activeScenario.effectiveMonthlyIncome : 0
  const monthlyHousing = activeScenario ? activeScenario.recommendedOption.monthlyTotalHousing : 0
  const annualInvestable = Math.max(monthlyTakeHome - monthlySpending, 0) * 12

  return (
    <main className="app-shell">
      <label className="theme-switcher" aria-label="Color theme">
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">☀️</option>
          <option value="dark">🌙</option>
          <option value="hc">◑</option>
        </select>
      </label>
      <header className="app-header">
        <h1>Home Affordability Calculator</h1>
        <p>
          Honolulu-focused affordability calculator. Affordability mode uses 25% of net
          take-home; Lender mode uses the 28/36 rule on gross income. Defaults reflect
          Honolulu market rates for HOA, insurance, property tax, and cost of living.
        </p>
      </header>

      <section className="panel">
        <h2>Income Inputs</h2>

        {/* Primary person block */}
        <div className="person-block">
          <div className="grid two-col">
            <NumberInput
              label="Primary annual salary"
              value={inputs.primarySalary}
              onChange={update('primarySalary')}
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
                  {currency.format(getEmployerMatch(inputs.primary401kContribution, inputs.primary401kMatchPercent))}/yr
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
                    {currency.format(getEmployerMatch(inputs.partner401kContribution, inputs.partner401kMatchPercent))}/yr
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

      {/* Mode toggle — sits between income inputs and the mode-dependent sections */}
      <div className="mode-toggle-bar">
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
            Uses 28/36 rule on gross income. Investment returns are excluded as lenders require a 2-year documented history.
          </p>
        )}
      </div>

      <AffordabilityInputs inputs={inputs} update={update} />

      {inputs.incomeMode === 'net' && (
        <SpendingInputs items={spendingItems} onChange={setSpendingItems} />
      )}

      <section className="results-grid" aria-live="polite">
        <ScenarioCard title="Solo Income" scenario={soloScenario} />
        {inputs.includePartner && (
          <ScenarioCard title="Combined Income" scenario={combinedScenario} />
        )}
      </section>

      {inputs.incomeMode === 'net' && (
        <BudgetChart
          monthlyTakeHome={monthlyTakeHome}
          monthlyHousing={monthlyHousing}
          monthlySpending={monthlySpendingForChart}
          rentExcluded={monthlySpending !== monthlySpendingForChart}
        />
      )}

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
            annualContribution={annualInvestable}
            monthlyHousingBudget={activeScenario ? activeScenario.adjustedHousingBudget : 0}
          />
        </section>
      )}
    </main>
  )
}

export default App
