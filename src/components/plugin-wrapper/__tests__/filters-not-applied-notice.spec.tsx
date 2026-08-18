import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import {
    FiltersNotAppliedNotice,
    hasUnappliedFilters,
} from '../filters-not-applied-notice'

describe('hasUnappliedFilters', () => {
    it('is false for no filters', () => {
        expect(hasUnappliedFilters(undefined)).toBe(false)
        expect(hasUnappliedFilters({})).toBe(false)
    })

    it('is false for relativePeriodDate alone, which is applied', () => {
        expect(hasUnappliedFilters({ relativePeriodDate: '2024-01-01' })).toBe(
            false
        )
    })

    it('is true for an org unit filter', () => {
        expect(hasUnappliedFilters({ ou: [{ id: 'ImspTQPwCqd' }] })).toBe(true)
    })

    it('is true for a period filter', () => {
        expect(hasUnappliedFilters({ pe: [{ id: 'LAST_12_MONTHS' }] })).toBe(
            true
        )
    })

    it('is true for a your-dimension filter', () => {
        expect(
            hasUnappliedFilters({
                yourDimensions: { uIuxlbV1vRT: [{ id: 'J40PpdN4Wkk' }] },
            })
        ).toBe(true)
    })

    it('is false for empty arrays, which carry no selection', () => {
        expect(hasUnappliedFilters({ ou: [], pe: [] })).toBe(false)
        expect(hasUnappliedFilters({ yourDimensions: {} })).toBe(false)
    })

    it('is false when a your-dimension key is present but its array is empty', () => {
        expect(
            hasUnappliedFilters({ yourDimensions: { uIuxlbV1vRT: [] } })
        ).toBe(false)
    })
})

describe('FiltersNotAppliedNotice', () => {
    it('renders nothing when every filter is applied', () => {
        const { container } = render(
            <FiltersNotAppliedNotice
                filters={{ relativePeriodDate: '2024-01-01' }}
            />
        )
        expect(container).toBeEmptyDOMElement()
    })

    it('can be dismissed', async () => {
        const user = userEvent.setup()
        render(<FiltersNotAppliedNotice filters={{ ou: [{ id: 'x' }] }} />)

        expect(screen.getByRole('button')).toBeInTheDocument()
        await user.click(screen.getByRole('button'))

        expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('reappears when the filters change after a dismissal', async () => {
        const user = userEvent.setup()
        const { rerender } = render(
            <FiltersNotAppliedNotice filters={{ ou: [{ id: 'x' }] }} />
        )

        await user.click(screen.getByRole('button'))
        expect(screen.queryByRole('button')).not.toBeInTheDocument()

        rerender(<FiltersNotAppliedNotice filters={{ ou: [{ id: 'y' }] }} />)

        expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('announces itself to screen readers via a live region', () => {
        render(<FiltersNotAppliedNotice filters={{ ou: [{ id: 'x' }] }} />)

        expect(screen.getByRole('status')).toHaveTextContent(
            'Filters are not applied to Event visualizations'
        )
    })

    it('renders nothing while loading, even with an unapplied filter', () => {
        const { container } = render(
            <FiltersNotAppliedNotice
                filters={{ ou: [{ id: 'x' }] }}
                isLoading
            />
        )
        expect(container).toBeEmptyDOMElement()
    })

    it('reappears once loading finishes, if the filter is still unapplied', () => {
        const { rerender } = render(
            <FiltersNotAppliedNotice
                filters={{ ou: [{ id: 'x' }] }}
                isLoading
            />
        )
        expect(screen.queryByRole('status')).not.toBeInTheDocument()

        rerender(
            <FiltersNotAppliedNotice
                filters={{ ou: [{ id: 'x' }] }}
                isLoading={false}
            />
        )
        expect(screen.getByRole('status')).toBeInTheDocument()
    })
})
