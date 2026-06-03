import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ShowAllFilterRadio } from '../show-all-filter-radio'

describe('ShowAllFilterRadio', () => {
    it('renders an accessible group with both options', () => {
        render(<ShowAllFilterRadio mode="SHOW_ALL" onModeChange={vi.fn()} />)

        expect(screen.getByText('Value filtering')).toBeInTheDocument()
        expect(
            screen.getByRole('radio', { name: 'Show all' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('radio', { name: 'Filter' })
        ).toBeInTheDocument()
    })

    it('hides children under "Show all" and reveals them under "Filter"', () => {
        const { rerender } = render(
            <ShowAllFilterRadio mode="SHOW_ALL" onModeChange={vi.fn()}>
                <div>revealed filter ui</div>
            </ShowAllFilterRadio>
        )

        expect(screen.queryByText('revealed filter ui')).not.toBeInTheDocument()
        expect(screen.getByRole('radio', { name: 'Show all' })).toBeChecked()

        rerender(
            <ShowAllFilterRadio mode="FILTER" onModeChange={vi.fn()}>
                <div>revealed filter ui</div>
            </ShowAllFilterRadio>
        )

        expect(screen.getByText('revealed filter ui')).toBeInTheDocument()
        expect(screen.getByRole('radio', { name: 'Filter' })).toBeChecked()
    })

    it('calls onModeChange with the chosen mode when a radio is selected', async () => {
        const user = userEvent.setup()
        const onModeChange = vi.fn()

        render(
            <ShowAllFilterRadio mode="SHOW_ALL" onModeChange={onModeChange}>
                <div>revealed filter ui</div>
            </ShowAllFilterRadio>
        )

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(onModeChange).toHaveBeenCalledWith('FILTER')
    })
})
