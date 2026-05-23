import { currency, getAccountReturn } from '../calculations'
import { INVESTMENT_ACCOUNTS } from '../constants'
import NumberInput from './NumberInput'

const InvestmentInputs = ({ prefix, inputs, update }) => {
  const rows = INVESTMENT_ACCOUNTS.map(({ key, label, type }) => {
    const balance = Number(inputs[`${prefix}${key}Balance`]) || 0
    const rate = Number(inputs[`${prefix}${key}Rate`]) || 0
    return { key, label, type, balance, rate, annualReturn: getAccountReturn(balance, rate, type) }
  })

  const totalAnnualReturn = rows.reduce((sum, r) => sum + r.annualReturn, 0)

  return (
    <div className="investment-inputs">
      <div className="investment-header">
        <span>Account</span>
        <span>Balance / Contribution</span>
        <span>Est. Annual Return (%)</span>
        <span>Annual Income</span>
      </div>
      {rows.map(({ key, label, type, annualReturn }) => (
        <div key={key} className="investment-row">
          <span className="investment-label">
            {label}
            {type === 'espp' && (
              <span className="investment-hint"> — annual contribution</span>
            )}
          </span>
          <NumberInput
            label=""
            value={inputs[`${prefix}${key}Balance`]}
            onChange={update(`${prefix}${key}Balance`)}
          />
          <NumberInput
            label=""
            value={inputs[`${prefix}${key}Rate`]}
            onChange={update(`${prefix}${key}Rate`)}
            step="0.01"
            placeholder={type === 'espp' ? 'Stock return %' : undefined}
          />
          <span className="investment-return">{currency.format(annualReturn)}</span>
        </div>
      ))}
      <div className="investment-total">
        <span>Total annual investment income</span>
        <strong>{currency.format(totalAnnualReturn)}</strong>
      </div>
    </div>
  )
}

export default InvestmentInputs
