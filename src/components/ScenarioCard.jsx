import { currency } from '../calculations'

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

export default ScenarioCard
