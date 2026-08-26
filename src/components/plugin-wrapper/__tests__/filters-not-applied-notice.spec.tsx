import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import {
    FiltersNotAppliedNotice,
    hasUnappliedFilters,
} from '../filters-not-applied-notice'

describe('hasUnappliedFilters', () => {
    it('is false with no filters, or only relativePeriodDate (which is applied)', () => {
        expect(hasUnappliedFilters(undefined)).toBe(false)
        expect(hasUnappliedFilters({})).toBe(false)
        expect(hasUnappliedFilters({ relativePeriodDate: '2024-01-01' })).toBe(
            false
        )
    })

    it('is true when any other filter is present', () => {
        expect(hasUnappliedFilters({ ou: [{ id: 'ImspTQPwCqd' }] })).toBe(true)
    })
})

describe('FiltersNotAppliedNotice', () => {
    it('renders nothing when only relativePeriodDate is set', () => {
        const { container } = render(
            <FiltersNotAppliedNotice
                filters={{ relativePeriodDate: '2024-01-01' }}
            />
        )
        expect(container).toBeEmptyDOMElement()
    })

    it('shows a live-region notice when a filter was not applied', () => {
        render(<FiltersNotAppliedNotice filters={{ ou: [{ id: 'x' }] }} />)

        expect(screen.getByRole('status')).toHaveTextContent(
            'Filters are not applied to Event visualizations'
        )
    })

    it('reappears when the filters change after a dismissal', async () => {
        const user = userEvent.setup()
        const { rerender } = render(
            <FiltersNotAppliedNotice filters={{ ou: [{ id: 'x' }] }} />
        )

        await user.click(screen.getByRole('button'))
        expect(screen.queryByRole('status')).not.toBeInTheDocument()

        rerender(<FiltersNotAppliedNotice filters={{ ou: [{ id: 'y' }] }} />)

        expect(screen.getByRole('status')).toBeInTheDocument()
    })
})
