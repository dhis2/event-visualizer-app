import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CellValueOption } from '../cell-value-option'

describe('CellValueOption', () => {
    const baseProps = {
        label: 'Weight in kg',
        value: 'weight-id',
        active: false,
        onClick: () => {},
    }

    it('renders the label', () => {
        render(<CellValueOption {...baseProps} />)
        expect(screen.getByText('Weight in kg')).toBeInTheDocument()
    })

    it('renders the stage chip when stageName is provided', () => {
        render(<CellValueOption {...baseProps} stageName="Antenatal visit" />)
        expect(screen.getByText('Antenatal visit')).toBeInTheDocument()
    })

    it('omits the stage chip when stageName is absent', () => {
        render(<CellValueOption {...baseProps} />)
        expect(screen.getByRole('button').textContent).toBe('Weight in kg')
    })

    it('reflects active state via aria-pressed', () => {
        const { rerender } = render(<CellValueOption {...baseProps} />)
        expect(screen.getByRole('button')).toHaveAttribute(
            'aria-pressed',
            'false'
        )

        rerender(<CellValueOption {...baseProps} active />)
        expect(screen.getByRole('button')).toHaveAttribute(
            'aria-pressed',
            'true'
        )
    })

    it('invokes onClick when clicked', async () => {
        const onClick = vi.fn()
        const user = userEvent.setup()
        render(<CellValueOption {...baseProps} onClick={onClick} />)

        await user.click(screen.getByRole('button'))
        expect(onClick).toHaveBeenCalledOnce()
    })
})
