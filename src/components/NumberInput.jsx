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

export default NumberInput
