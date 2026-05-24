export default function SpendingInputs({ items, onChange }) {
  const addItem = () => {
    onChange([
      ...items,
      { id: Date.now().toString(), name: '', amount: 0, frequency: 'monthly' },
    ])
  }

  const updateItem = (id, field, value) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const removeItem = (id) => {
    onChange(items.filter((item) => item.id !== id))
  }

  return (
    <section className="panel">
      <h2>Spending</h2>
      <p className="panel-hint">
        Track recurring expenses to see how they affect your post-tax budget.
      </p>
      <div className="spending-list">
        <div className="spending-row spending-header">
          <span>Expense</span>
          <span>Amount</span>
          <span>Frequency</span>
          <span />
        </div>
        {items.map((item) => (
          <div key={item.id} className="spending-row">
            <input
              className="spending-name"
              type="text"
              placeholder="e.g. Gym membership"
              value={item.name}
              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
              aria-label="Expense name"
            />
            <input
              className="spending-amount"
              type="number"
              min="0"
              value={item.amount}
              onChange={(e) => updateItem(item.id, 'amount', Number(e.target.value))}
              aria-label="Amount"
            />
            <select
              className="spending-freq-select"
              value={item.frequency}
              onChange={(e) => updateItem(item.id, 'frequency', e.target.value)}
              aria-label="Frequency"
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
            <button
              className="spending-remove"
              onClick={() => removeItem(item.id)}
              type="button"
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button className="add-spending-btn" onClick={addItem} type="button">
        + Add item
      </button>
    </section>
  )
}
