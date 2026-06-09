import {
    visUiConfigSlice,
    initialState,
    getVisUiConfigConditionsByDimension,
    type ConditionsObject,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { renderWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import { ConditionsTabContent } from '../conditions-tab-content'

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

const numericDimension: DimensionMetadataItem = {
    id: 'numeric-de',
    dimensionId: 'numeric-de',
    dimensionType: 'DATA_ELEMENT',
    name: 'My numeric element',
    valueType: 'NUMBER',
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
        expect(
            screen.queryByTestId('alphanumeric-condition')
        ).not.toBeInTheDocument()
    })

    it('seeds one editable condition row immediately when switching to Filter', async () => {
        const user = userEvent.setup()
        setup()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(screen.getAllByTestId('alphanumeric-condition')).toHaveLength(1)
    })

    it('uses a single static "Add filter" label regardless of condition count', () => {
        setup({ de1: { condition: 'LIKE:foo:LIKE:bar' } })

        expect(screen.getAllByTestId('alphanumeric-condition')).toHaveLength(2)
        expect(
            screen.getByRole('button', { name: 'Add filter' })
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Add another filter' })
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
        expect(screen.getByTestId('alphanumeric-condition')).toBeInTheDocument()
    })

    it('opens on "Filter" when only a legendSet is persisted', () => {
        setup({ de1: { legendSet: 'LEGEND_SET_1' } })

        expect(screen.getByRole('radio', { name: 'Filter' })).toBeChecked()
        expect(screen.getByTestId('alphanumeric-condition')).toBeInTheDocument()
    })

    it('discards the condition on save under "Show all" but restores it on toggle back', async () => {
        const user = userEvent.setup()
        const store = setup({ de1: { condition: 'LIKE:foo' } })

        await user.click(screen.getByRole('radio', { name: 'Show all values' }))

        expect(
            getVisUiConfigConditionsByDimension(store.getState(), 'de1')
                .condition
        ).toBeUndefined()
        expect(
            screen.queryByTestId('alphanumeric-condition')
        ).not.toBeInTheDocument()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(
            getVisUiConfigConditionsByDimension(store.getState(), 'de1')
                .condition
        ).toBe('LIKE:foo')
        expect(screen.getByTestId('alphanumeric-condition')).toBeInTheDocument()
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
        expect(
            screen.queryByTestId('alphanumeric-condition')
        ).not.toBeInTheDocument()
    })

    it('collapses selected legend chips to a count', async () => {
        await renderWithAppWrapper(
            <ConditionsTabContent dimension={numericDimension} />,
            {
                metadata: {
                    LEGEND_SET_1: {
                        id: 'LEGEND_SET_1',
                        name: 'Weight legends',
                        legends: [
                            {
                                id: 'LEGEND_1',
                                name: 'Low',
                                startValue: 0,
                                endValue: 10,
                            },
                            {
                                id: 'LEGEND_2',
                                name: 'High',
                                startValue: 11,
                                endValue: 20,
                            },
                        ],
                    },
                },
                partialStore: {
                    preloadedState: {
                        visUiConfig: {
                            ...initialState,
                            conditionsByDimension: {
                                [numericDimension.id]: {
                                    condition: 'IN:LEGEND_1;LEGEND_2',
                                    legendSet: 'LEGEND_SET_1',
                                },
                            },
                        },
                    },
                },
            }
        )

        expect(screen.getByText('2 selected')).toBeInTheDocument()
    })
})

describe('ConditionsTabContent — value input focus', () => {
    it('focuses the value input after an operator is chosen', async () => {
        const user = userEvent.setup()
        setup()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))
        await user.click(screen.getByText('Choose a filter type'))
        await user.click(screen.getByText('contains'))

        await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus())
    })

    it('does not steal focus when a condition is restored with an operator', () => {
        setup({ de1: { condition: 'LIKE:foo' } })

        expect(screen.getByDisplayValue('foo')).not.toHaveFocus()
    })
})
