import {
    visUiConfigSlice,
    initialState,
    getVisUiConfigConditionsByDimension,
    type ConditionsObject,
} from '@store/vis-ui-config-slice'
import { renderWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DimensionMetadataItem } from '@types'
import { describe, it, expect, vi } from 'vitest'
import { ConditionsTabContent } from '../conditions-tab-content'

/* The filter UI itself is exercised elsewhere and needs metadata context;
 * here we only assert the radio's derived state and toggle behaviour, so the
 * value-type switch is stubbed. */
vi.mock('../conditions', () => ({
    Conditions: () => <div data-test="conditions-ui">conditions ui</div>,
}))

const textDimension: DimensionMetadataItem = {
    id: 'de1',
    dimensionId: 'de1',
    dimensionType: 'DATA_ELEMENT',
    name: 'My text element',
    valueType: 'TEXT',
}

const unfilterableDimension: DimensionMetadataItem = {
    id: 'de2',
    dimensionId: 'de2',
    dimensionType: 'DATA_ELEMENT',
    name: 'My file element',
    valueType: 'FILE_RESOURCE',
}

const setup = (
    conditionsByDimension: Record<string, ConditionsObject | undefined> = {},
    dimension: DimensionMetadataItem = textDimension
) => {
    const store = setupStore(
        { visUiConfig: visUiConfigSlice.reducer },
        { visUiConfig: { ...initialState, conditionsByDimension } }
    )

    renderWithReduxStoreProvider(
        <ConditionsTabContent dimension={dimension} />,
        store
    )

    return store
}

describe('ConditionsTabContent — Show all / Filter', () => {
    it('defaults to "Show all" when no filter is persisted', () => {
        setup()

        expect(
            screen.getByRole('radio', { name: 'Show all values' })
        ).toBeChecked()
        expect(screen.queryByTestId('conditions-ui')).not.toBeInTheDocument()
    })

    it('seeds one editable condition row immediately when switching to Filter', async () => {
        const user = userEvent.setup()
        setup()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(screen.getByTestId('conditions-ui')).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Add another filter' })
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Add a filter' })
        ).not.toBeInTheDocument()
    })

    it('persists no condition when Filter is selected but left empty', async () => {
        const user = userEvent.setup()
        const store = setup()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(
            getVisUiConfigConditionsByDimension(store.getState(), 'de1')
                .condition
        ).toBeUndefined()
    })

    it('opens on "Filter" when a condition string is persisted', () => {
        setup({ de1: { condition: 'LIKE:foo' } })

        expect(screen.getByRole('radio', { name: 'Filter' })).toBeChecked()
        expect(screen.getByTestId('conditions-ui')).toBeInTheDocument()
    })

    it('opens on "Filter" when only a legendSet is persisted', () => {
        setup({ de1: { legendSet: 'LEGEND_SET_1' } })

        expect(screen.getByRole('radio', { name: 'Filter' })).toBeChecked()
        expect(screen.getByTestId('conditions-ui')).toBeInTheDocument()
    })

    it('discards the condition on save under "Show all" but restores it on toggle back', async () => {
        const user = userEvent.setup()
        const store = setup({ de1: { condition: 'LIKE:foo' } })

        await user.click(screen.getByRole('radio', { name: 'Show all values' }))

        expect(
            getVisUiConfigConditionsByDimension(store.getState(), 'de1')
                .condition
        ).toBeUndefined()
        expect(screen.queryByTestId('conditions-ui')).not.toBeInTheDocument()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(
            getVisUiConfigConditionsByDimension(store.getState(), 'de1')
                .condition
        ).toBe('LIKE:foo')
        expect(screen.getByTestId('conditions-ui')).toBeInTheDocument()
    })

    it('shows a disabled "Filter" with help text for an unfilterable dimension', () => {
        setup({}, unfilterableDimension)

        expect(
            screen.getByRole('radio', { name: 'Show all values' })
        ).toBeChecked()
        expect(screen.getByRole('radio', { name: 'Filter' })).toBeDisabled()
        expect(
            screen.getByText('File type dimensions cannot be filtered.')
        ).toBeInTheDocument()
        expect(screen.queryByTestId('conditions-ui')).not.toBeInTheDocument()
    })
})
