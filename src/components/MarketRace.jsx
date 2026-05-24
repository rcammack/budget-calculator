import { currency, projectMarketRace, toNumber } from '../calculations'
import NumberInput from './NumberInput'

const MarketRace = ({ inputs, update, currentPortfolio, portfolioReturnRate, annualContribution }) => {
  const targetHomePrice       = toNumber(inputs.targetHomePrice)
  const housingAppreciationRate = toNumber(inputs.housingAppreciationRate)

  const projection = projectMarketRace({
    currentPortfolio,
    portfolioReturnRate,
    annualContribution,
    targetHomePrice,
    housingAppreciationRate,
    years: 10,
  })

  const now     = projection[0]
  const in5     = projection[5]
  const in10    = projection[10]
  const gapNow  = now.gap
  const gap5    = in5.gap
  const gap10   = in10.gap

  const gapClosingPerYear = (gapNow - gap5) / 5
  const isClosing = gapClosingPerYear > 0

  // Find break-even year (first year gap ≤ 0)
  const breakEven = projection.find((p) => p.gap <= 0)

  return (
    <div className="market-race">
      <h3>🏁 Can Your Investments Keep Up With the Market?</h3>

      <div className="market-race-inputs">
        <NumberInput
          label="Target home price ($)"
          value={inputs.targetHomePrice}
          onChange={update('targetHomePrice')}
          hint="Current asking price of the home you want"
        />
        <NumberInput
          label="Hawaii housing appreciation (%/yr)"
          value={inputs.housingAppreciationRate}
          onChange={update('housingAppreciationRate')}
          step="0.1"
          hint="Oahu historical avg ~5%/yr"
        />
        <div className="field">
          <span className="race-savings-hint">Annual investable income</span>
          <strong className="race-savings-value">{currency.format(annualContribution)}/yr</strong>
          <span className="race-savings-sub">take-home minus spending (add rent to spending panel)</span>
        </div>
      </div>

      <div className="market-race-stats">
        <div className="race-stat">
          <span className="race-stat-label">Your portfolio return rate</span>
          <span className="race-stat-value">{portfolioReturnRate.toFixed(1)}%/yr</span>
          <span className="race-stat-hint">weighted avg across accounts</span>
        </div>
        <div className="race-stat">
          <span className="race-stat-label">Housing appreciation rate</span>
          <span className="race-stat-value">{housingAppreciationRate}%/yr</span>
          <span className="race-stat-hint">from market data</span>
        </div>
      </div>

      <div className="race-timeline">
        <div className="race-row race-row-header">
          <span></span>
          <span>Portfolio</span>
          <span>20% Down Needed</span>
          <span>Gap</span>
        </div>
        {[now, in5, in10].map(({ year, portfolio, downPaymentNeeded, gap }) => (
          <div key={year} className={`race-row${gap <= 0 ? ' race-row-reached' : ''}`}>
            <span className="race-year">{year === 0 ? 'Today' : `Year ${year}`}</span>
            <span>{currency.format(portfolio)}</span>
            <span>{currency.format(downPaymentNeeded)}</span>
            <span className={`race-gap${gap <= 0 ? ' race-gap-met' : gap < gapNow ? ' race-gap-closing' : ' race-gap-widening'}`}>
              {gap <= 0 ? `✓ +${currency.format(Math.abs(gap))}` : `−${currency.format(gap)}`}
            </span>
          </div>
        ))}
      </div>

      <div className={`race-verdict ${isClosing ? 'race-verdict-good' : 'race-verdict-bad'}`}>
        {isClosing ? (
          breakEven ? (
            <>
              <strong>✓ Gap is closing.</strong> At these rates you could cover the 20% down payment
              in approximately <strong>year {breakEven.year}</strong> (
              {currency.format(breakEven.homePrice)} home,{' '}
              {currency.format(breakEven.downPaymentNeeded)} down).
            </>
          ) : (
            <>
              <strong>✓ Gap is closing</strong> by ~{currency.format(gapClosingPerYear)}/yr, but
              doesn't close within 10 years at these rates.
            </>
          )
        ) : (
          <>
            <strong>⚠ Gap is widening</strong> by ~{currency.format(Math.abs(gapClosingPerYear))}/yr.
            The home is appreciating faster than your portfolio —{' '}
            {portfolioReturnRate < housingAppreciationRate
              ? `your investment return (${portfolioReturnRate.toFixed(1)}%) is below the housing appreciation rate (${housingAppreciationRate}%).`
              : 'increasing annual contributions would help close the gap.'}
          </>
        )}
      </div>
    </div>
  )
}

export default MarketRace
