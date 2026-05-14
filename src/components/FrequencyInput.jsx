import NumberInput from './NumberInput'

const FrequencyInput = ({ label, amount, frequency, onAmountChange, onFrequencyChange }) => (
  <div className="field-group">
    <NumberInput label={label} value={amount} onChange={onAmountChange} />
    <label className="field">
      <span>Frequency</span>
      <select value={frequency} onChange={(event) => onFrequencyChange(event.target.value)}>
        <option value="monthly">Monthly</option>
        <option value="annual">Annual</option>
      </select>
    </label>
  </div>
)

export default FrequencyInput
