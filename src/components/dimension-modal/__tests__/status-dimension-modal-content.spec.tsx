import {
    visUiConfigSlice,
    initialState,
    getVisUiConfigItemsByDimension,
} from '@store/vis-ui-config-slice'
import { renderWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import { StatusDimensionModalContent } from '../status-dimension-modal-content'

const eventStatusDimension: DimensionMetadataItem = {
    id: 'stage1.eventStatus',
    dimensionId: 'eventStatus',
    dimensionType: 'STATUS',
    name: 'Event status',
}

const programStatusDimension: DimensionMetadataItem = {
    id: 'program1.programStatus',
    dimensionId: 'programStatus',
    dimensionType: 'STATUS',
    name: 'Enrollment status',
}

const setup = (
    itemsByDimension: Record<string, string[]> = {},
    dimension: DimensionMetadataItem = eventStatusDimension
) => {
    const store = setupStore(
        { visUiConfig: visUiConfigSlice.reducer },
        { visUiConfig: { ...initialState, itemsByDimension } }
    )

    renderWithReduxStoreProvider(
        <StatusDimensionModalContent dimension={dimension} />,
        store
    )

    return store
}

describe('StatusDimensionModalContent — Show all / Filter', () => {
    it('defaults a freshly-added status dimension to "Show all"', () => {
        setup()

        expect(
            screen.getByRole('radio', { name: 'Show all values' })
        ).toBeChecked()
        expect(screen.getByRole('radio', { name: 'Filter' })).not.toBeChecked()
        expect(
            screen.queryByRole('checkbox', { name: 'Active' })
        ).not.toBeInTheDocument()
    })

    it('opens on "Filter" when a status is already selected', () => {
        setup({ 'stage1.eventStatus': ['ACTIVE'] })

        expect(screen.getByRole('radio', { name: 'Filter' })).toBeChecked()
        expect(screen.getByRole('checkbox', { name: 'Active' })).toBeChecked()
    })

    it('discards the selection on save under "Show all" but restores it on toggle back', async () => {
        const user = userEvent.setup()
        const store = setup({ 'stage1.eventStatus': ['ACTIVE'] })

        await user.click(screen.getByRole('radio', { name: 'Show all values' }))

        expect(
            getVisUiConfigItemsByDimension(
                store.getState(),
                'stage1.eventStatus'
            )
        ).toEqual([])
        expect(
            screen.queryByRole('checkbox', { name: 'Active' })
        ).not.toBeInTheDocument()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(
            getVisUiConfigItemsByDimension(
                store.getState(),
                'stage1.eventStatus'
            )
        ).toEqual(['ACTIVE'])
        expect(screen.getByRole('checkbox', { name: 'Active' })).toBeChecked()
    })

    it('persists zero items when "Filter" is selected but nothing is chosen', async () => {
        const user = userEvent.setup()
        const store = setup()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(
            getVisUiConfigItemsByDimension(
                store.getState(),
                'stage1.eventStatus'
            )
        ).toEqual([])
    })
})

describe('StatusDimensionModalContent — status options', () => {
    it('offers Scheduled, not Cancelled, for event status', () => {
        setup({ 'stage1.eventStatus': ['ACTIVE'] })

        expect(
            screen.getByRole('checkbox', { name: 'Scheduled' })
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('checkbox', { name: 'Cancelled' })
        ).not.toBeInTheDocument()
    })

    it('offers Cancelled, not Scheduled, for enrollment status', () => {
        setup({ 'program1.programStatus': ['ACTIVE'] }, programStatusDimension)

        expect(
            screen.getByRole('checkbox', { name: 'Cancelled' })
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('checkbox', { name: 'Scheduled' })
        ).not.toBeInTheDocument()
    })
})
