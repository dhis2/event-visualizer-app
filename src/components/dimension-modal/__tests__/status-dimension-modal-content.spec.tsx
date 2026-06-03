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
    id: 'eventStatus',
    dimensionId: 'eventStatus',
    dimensionType: 'STATUS',
    name: 'Event status',
}

const setup = (itemsByDimension: Record<string, string[]> = {}) => {
    const store = setupStore(
        { visUiConfig: visUiConfigSlice.reducer },
        { visUiConfig: { ...initialState, itemsByDimension } }
    )

    renderWithReduxStoreProvider(
        <StatusDimensionModalContent dimension={eventStatusDimension} />,
        store
    )

    return store
}

describe('StatusDimensionModalContent — Show all / Filter', () => {
    it('defaults a freshly-added status dimension to "Show all"', () => {
        setup()

        expect(screen.getByRole('radio', { name: 'Show all' })).toBeChecked()
        expect(screen.getByRole('radio', { name: 'Filter' })).not.toBeChecked()
        expect(
            screen.queryByRole('checkbox', { name: 'Active' })
        ).not.toBeInTheDocument()
    })

    it('opens on "Filter" when a status is already selected', () => {
        setup({ eventStatus: ['ACTIVE'] })

        expect(screen.getByRole('radio', { name: 'Filter' })).toBeChecked()
        expect(screen.getByRole('checkbox', { name: 'Active' })).toBeChecked()
    })

    it('discards the selection on save under "Show all" but restores it on toggle back', async () => {
        const user = userEvent.setup()
        const store = setup({ eventStatus: ['ACTIVE'] })

        await user.click(screen.getByRole('radio', { name: 'Show all' }))

        expect(
            getVisUiConfigItemsByDimension(store.getState(), 'eventStatus')
        ).toEqual([])
        expect(
            screen.queryByRole('checkbox', { name: 'Active' })
        ).not.toBeInTheDocument()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(
            getVisUiConfigItemsByDimension(store.getState(), 'eventStatus')
        ).toEqual(['ACTIVE'])
        expect(screen.getByRole('checkbox', { name: 'Active' })).toBeChecked()
    })

    it('persists zero items when "Filter" is selected but nothing is chosen', async () => {
        const user = userEvent.setup()
        const store = setup()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(
            getVisUiConfigItemsByDimension(store.getState(), 'eventStatus')
        ).toEqual([])
    })
})
