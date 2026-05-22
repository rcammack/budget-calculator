import { currency } from '../calculations'
import { toNumber } from '../calculations'

const DownPaymentAdvice = ({ inputs, recommendedHomePrice, liquidSavings }) => {
  const twentyPctDown = recommendedHomePrice * 0.2
  const excess = liquidSavings - twentyPctDown

  if (liquidSavings <= 0 || recommendedHomePrice <= 0) return null

  const mortgageRate  = toNumber(inputs.mortgageRate)
  const stockRate     = toNumber(inputs.primaryStocksRate)
  const hysaRate      = toNumber(inputs.primaryHysaRate)

  // Opportunity cost: investing the excess vs. paying down extra mortgage principal
  // Simplified: extra principal reduction saves ~mortgageRate% per year in interest
  const annualMortgageSaving = Math.max(excess, 0) * (mortgageRate / 100)
  const annualStockReturn    = Math.max(excess, 0) * (stockRate / 100)
  const annualHysaReturn     = Math.max(excess, 0) * (hysaRate / 100)

  const stockBeatsMortgage = stockRate > mortgageRate
  const hysaBeatsMortgage  = hysaRate  > mortgageRate

  const canCover20Pct = liquidSavings >= twentyPctDown

  return (
    <div className="dp-advice">
      <h3>💡 Down Payment Strategy</h3>

      <div className="dp-summary">
        <div className="dp-row">
          <span>Liquid savings (HYSA + Stocks + Savings)</span>
          <strong>{currency.format(liquidSavings)}</strong>
        </div>
        <div className="dp-row">
          <span>20% down on suggested home</span>
          <strong>{currency.format(twentyPctDown)}</strong>
        </div>
        {canCover20Pct ? (
          <div className="dp-row dp-excess">
            <span>Remainder to keep invested</span>
            <strong>{currency.format(excess)}</strong>
          </div>
        ) : (
          <div className="dp-row dp-shortfall">
            <span>Shortfall to reach 20% (avoid PMI)</span>
            <strong>−{currency.format(twentyPctDown - liquidSavings)}</strong>
          </div>
        )}
      </div>

      {canCover20Pct && excess > 0 && (
        <>
          <p className="dp-label">If you invest {currency.format(excess)} instead of putting it toward the mortgage:</p>
          <div className="dp-compare">
            <div className={`dp-option${stockBeatsMortgage ? ' dp-winner' : ''}`}>
              <span className="dp-option-name">Stocks (~{stockRate}%/yr)</span>
              <span className="dp-option-return">+{currency.format(annualStockReturn)}/yr</span>
              {stockBeatsMortgage
                ? <span className="dp-verdict dp-verdict-yes">✓ beats your {mortgageRate}% mortgage rate</span>
                : <span className="dp-verdict dp-verdict-no">✗ below your {mortgageRate}% mortgage rate</span>
              }
            </div>
            <div className={`dp-option${hysaBeatsMortgage ? ' dp-winner' : ''}`}>
              <span className="dp-option-name">HYSA (~{hysaRate}%/yr)</span>
              <span className="dp-option-return">+{currency.format(annualHysaReturn)}/yr</span>
              {hysaBeatsMortgage
                ? <span className="dp-verdict dp-verdict-yes">✓ beats your {mortgageRate}% mortgage rate</span>
                : <span className="dp-verdict dp-verdict-no">✗ below your {mortgageRate}% mortgage rate</span>
              }
            </div>
            <div className="dp-option dp-option-mortgage">
              <span className="dp-option-name">Extra down payment</span>
              <span className="dp-option-return">~{currency.format(annualMortgageSaving)}/yr saved</span>
              <span className="dp-verdict">guaranteed at {mortgageRate}%</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DownPaymentAdvice
