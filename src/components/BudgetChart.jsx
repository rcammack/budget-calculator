import { currency } from '../calculations'

const SEGMENTS = [
  { key: 'housing',  label: 'Housing',  color: 'var(--chart-housing)'  },
  { key: 'spending', label: 'Spending', color: 'var(--chart-spending)' },
  { key: 'leftover', label: 'Leftover', color: 'var(--chart-leftover)' },
]

function describeArc(cx, cy, r, startAngle, endAngle) {
  const toRad = (deg) => (deg - 90) * (Math.PI / 180)
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

export default function BudgetChart({ monthlyTakeHome, monthlyHousing, monthlySpending, rentExcluded }) {
  const leftover = Math.max(monthlyTakeHome - monthlyHousing - monthlySpending, 0)
  const total = monthlyTakeHome || 1

  const values = {
    housing:  monthlyHousing,
    spending: monthlySpending,
    leftover,
  }

  const overBudget = monthlyTakeHome > 0 && leftover / monthlyTakeHome < 0.15

  const cx = 80, cy = 80, r = 60, inner = 36
  let startAngle = 0
  const arcs = SEGMENTS.map(({ key, label, color }) => {
    const slice = (values[key] / total) * 360
    const endAngle = startAngle + slice
    const arc = slice > 0.5 ? describeArc(cx, cy, r, startAngle, endAngle) : null
    const result = { key, label, color, arc, startAngle, endAngle, value: values[key] }
    startAngle = endAngle
    return result
  })

  return (
    <section className="panel budget-chart-panel">
      <div className="budget-chart-header">
        <h2>Budget Breakdown</h2>
        {overBudget && (
          <span className="budget-warning" title="Less than 15% of take-home remaining after housing and spending">
            ⚠️ Tight — under 15% left over
          </span>
        )}
      </div>
      <p className="panel-hint">
        Monthly net take-home after tax &amp; 401k: <strong>{currency.format(monthlyTakeHome)}</strong>
        {' '}— how much breathing room does the mortgage leave?
        {rentExcluded && (
          <span className="panel-hint-note"> Rent excluded from Spending — Housing already covers it.</span>
        )}
      </p>
      <div className="budget-chart-body">
        <svg viewBox="0 0 160 160" className="donut-svg" aria-hidden="true">
          {arcs.map(({ key, color, arc }) =>
            arc ? (
              <path
                key={key}
                d={arc}
                fill="none"
                stroke={color}
                strokeWidth={r - inner}
                strokeLinecap="butt"
              />
            ) : null
          )}
          <circle cx={cx} cy={cy} r={inner} fill="var(--bg-panel)" />
        </svg>
        <ul className="budget-legend">
          {arcs.map(({ key, label, color, value }) => (
            <li key={key} className="legend-row">
              <span className="legend-dot" style={{ background: color }} />
              <span className="legend-label">{label}</span>
              <span className="legend-amount">{currency.format(value)}/mo</span>
              <span className="legend-pct">
                {monthlyTakeHome > 0 ? Math.round((value / monthlyTakeHome) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
