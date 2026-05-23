const NumberInput = ({ label, value, onChange, hint, tooltip, step = 'any' }) => (
  <label className="field">
    <span className="field-label-row">
      {label}
      {tooltip && (
        <span className="info-btn" aria-label={tooltip}>
          ⓘ
          <span className="info-tooltip">{tooltip}</span>
        </span>
      )}
    </span>
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
