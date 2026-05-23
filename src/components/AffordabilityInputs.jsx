import NumberInput from './NumberInput'
import { CREDIT_SCORE_OPTIONS } from '../constants'

const AffordabilityInputs = ({ inputs, update }) => (
  <section className="panel">
    <h2>Affordability Inputs</h2>
    <div className="grid three-col">
      <label className="field">
        <span>Credit score range</span>
        <select value={inputs.creditBand} onChange={(event) => update('creditBand')(event.target.value)}>
          {CREDIT_SCORE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <NumberInput
        label="Mortgage rate (%)"
        value={inputs.mortgageRate}
        onChange={update('mortgageRate')}
        step="0.01"
        hint="Default set to current HI average"
      />
      <NumberInput
        label="Monthly non-housing debt"
        value={inputs.monthlyDebts}
        onChange={update('monthlyDebts')}
        tooltip="Car loans, student loans, min. credit card payments. Not groceries or general living expenses."
      />
      <NumberInput
        label="Monthly HOA"
        value={inputs.monthlyHoa}
        onChange={update('monthlyHoa')}
      />
      <NumberInput
        label="Monthly home insurance"
        value={inputs.monthlyInsurance}
        onChange={update('monthlyInsurance')}
      />
      <NumberInput
        label="Property tax rate (%)"
        value={inputs.propertyTaxRate}
        onChange={update('propertyTaxRate')}
        step="0.01"
        hint="Honolulu average is ~0.28%"
      />
      <NumberInput
        label="High cost-of-living adjustment (%)"
        value={inputs.costOfLivingAdjustment}
        onChange={update('costOfLivingAdjustment')}
        step="0.1"
        hint="Applied as a housing budget reduction"
      />
    </div>
  </section>
)

export default AffordabilityInputs
