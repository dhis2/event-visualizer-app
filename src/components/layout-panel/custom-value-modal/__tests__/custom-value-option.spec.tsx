import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CustomValueOption } from '../custom-value-option'

describe('CustomValueOption', () => {
    const baseProps = {
        label: 'Weight in kg',
        value: 'weight-id',
        active: false,
        onClick: () => {},
    }

    it('renders the label', () => {
        render(<CustomValueOption {...baseProps} />)
        expect(screen.getByText('Weight in kg')).toBeInTheDocument()
    })

    it('renders the stage chip when stageName is provided', () => {
        render(<CustomValueOption {...baseProps} stageName="Antenatal visit" />)
        expect(screen.getByText('Antenatal visit')).toBeInTheDocument()
    })

    it('omits the stage chip when stageName is absent', () => {
        render(<CustomValueOption {...baseProps} />)
        expect(screen.getByRole('option').textContent).toBe('Weight in kg')
    })

    it('reflects active state via aria-selected', () => {
        const { rerender } = render(<CustomValueOption {...baseProps} />)
        expect(screen.getByRole('option')).toHaveAttribute(
            'aria-selected',
            'false'
        )

        rerender(<CustomValueOption {...baseProps} active />)
        expect(screen.getByRole('option')).toHaveAttribute(
            'aria-selected',
            'true'
        )
    })

    it('invokes onClick when clicked', async () => {
        const onClick = vi.fn()
        const user = userEvent.setup()
        render(<CustomValueOption {...baseProps} onClick={onClick} />)

        await user.click(screen.getByRole('option'))
        expect(onClick).toHaveBeenCalledOnce()
    })
})
