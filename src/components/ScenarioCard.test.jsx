import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ScenarioCard from './ScenarioCard'
import { calculateScenario } from '../calculations'
import { DEFAULT_INPUTS } from '../constants'

describe('ScenarioCard', () => {
  it('renders nothing when scenario is null', () => {
    const { container } = render(<ScenarioCard title="Solo Income" scenario={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the title', () => {
    const scenario = calculateScenario(120000, DEFAULT_INPUTS)
    render(<ScenarioCard title="Solo Income" scenario={scenario} />)
    expect(screen.getByText('Solo Income')).toBeInTheDocument()
  })

  it('renders a row for each down payment option', () => {
    const scenario = calculateScenario(120000, DEFAULT_INPUTS)
    render(<ScenarioCard title="Solo Income" scenario={scenario} />)
    const rows = screen.getAllByText(/%/)
    expect(rows.length).toBeGreaterThanOrEqual(4)
  })

  it('highlights the recommended row', () => {
    const scenario = calculateScenario(120000, DEFAULT_INPUTS)
    render(<ScenarioCard title="Solo Income" scenario={scenario} />)
    const recommended = document.querySelector('tr.recommended')
    expect(recommended).toBeInTheDocument()
  })
})
