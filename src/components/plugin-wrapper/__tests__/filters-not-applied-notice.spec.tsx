import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import {
    FiltersNotAppliedNotice,
    hasUnappliedFilters,
} from '../filters-not-applied-notice'

describe('hasUnappliedFilters', () => {
    it('is false when nothing needs a warning', () => {
        expect(hasUnappliedFilters(undefined)).toBe(false)
        expect(hasUnappliedFilters({})).toBe(false)
        // relativePeriodDate is applied, so it must not warn
        expect(hasUnappliedFilters({ relativePeriodDate: '2024-01-01' })).toBe(
            false
        )
        // present keys with no selected items carry nothing to apply
        expect(hasUnappliedFilters({ ou: [] })).toBe(false)
        expect(
            hasUnappliedFilters({ yourDimensions: { uIuxlbV1vRT: [] } })
        ).toBe(false)
    })

    it('is true when any dimension filter carries a selection', () => {
        // a flat filter and the nested yourDimensions shape are the two
        // distinct branches; which dimension it is does not matter
        expect(hasUnappliedFilters({ ou: [{ id: 'ImspTQPwCqd' }] })).toBe(true)
        expect(
            hasUnappliedFilters({
                yourDimensions: { uIuxlbV1vRT: [{ id: 'J40PpdN4Wkk' }] },
            })
        ).toBe(true)
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
