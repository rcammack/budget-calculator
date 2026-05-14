import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import NumberInput from './NumberInput'

describe('NumberInput', () => {
  it('renders the label', () => {
    render(<NumberInput label="Annual salary" value={100000} onChange={() => {}} />)
    expect(screen.getByText('Annual salary')).toBeInTheDocument()
  })

  it('renders the current value', () => {
    render(<NumberInput label="Annual salary" value={120000} onChange={() => {}} />)
    expect(screen.getByRole('spinbutton')).toHaveValue(120000)
  })

  it('renders a hint when provided', () => {
    render(<NumberInput label="Rate" value={6.75} onChange={() => {}} hint="HI average" />)
    expect(screen.getByText('HI average')).toBeInTheDocument()
  })

  it('does not render a hint when omitted', () => {
    render(<NumberInput label="Rate" value={6.75} onChange={() => {}} />)
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })
})
