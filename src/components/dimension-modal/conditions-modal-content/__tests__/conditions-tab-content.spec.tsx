import {
    visUiConfigSlice,
    initialState,
    getVisUiConfigConditionsByDimension,
    type ConditionsObject,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
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

const twoLegendSets = [
    { id: 'LEGEND_SET_1', name: 'Weight legends', legends: [] },
    {
        id: 'LEGEND_SET_2',
        name: 'Age legends',
        /* deliberately out of order to exercise the startValue sort */
        legends: [
            { id: 'A3', name: '20-30', startValue: 20, endValue: 30 },
            { id: 'A1', name: '0-10', startValue: 0, endValue: 10 },
            { id: 'A5', name: '40-50', startValue: 40, endValue: 50 },
            { id: 'A2', name: '10-20', startValue: 10, endValue: 20 },
            { id: 'A4', name: '30-40', startValue: 30, endValue: 40 },
        ],
    },
]

const legendSet1Detail = {
    id: 'LEGEND_SET_1',
    name: 'Weight legends',
    legends: [
        { id: 'LEGEND_1', name: 'Low', startValue: 0, endValue: 10 },
        { id: 'LEGEND_2', name: 'High', startValue: 11, endValue: 20 },
    ],
}

const numericQueryData = {
    dataElements: { legendSets: twoLegendSets },
    legendSets: legendSet1Detail,
}

const renderTab = (
    conditionsByDimension: Record<string, ConditionsObject | undefined> = {},
    dimension: DimensionMetadataItem = textDimension,
    queryData?: MockOptions['queryData']
) =>
    renderWithAppWrapper(<ConditionsTabContent dimension={dimension} />, {
        queryData,
        partialStore: {
            reducer: { visUiConfig: visUiConfigSlice.reducer },
            preloadedState: {
                visUiConfig: { ...initialState, conditionsByDimension },
            },
        },
    })

describe('ConditionsTabContent — Show all / Filter', () => {
    it('defaults to "Show all" when no filter is persisted', async () => {
        await renderTab()

        expect(
            screen.getByRole('radio', { name: 'Show all values' })
        ).toBeChecked()
        expect(
            screen.queryByTestId('alphanumeric-condition')
        ).not.toBeInTheDocument()
    })

    it('seeds one editable condition row immediately when switching to Filter', async () => {
        const user = userEvent.setup()
        await renderTab()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(screen.getAllByTestId('alphanumeric-condition')).toHaveLength(1)
    })

    it('uses a single static "Add filter" label regardless of condition count', async () => {
        await renderTab({ de1: { condition: 'LIKE:foo:LIKE:bar' } })

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
        const { store } = await renderTab()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(
            getVisUiConfigConditionsByDimension(store.getState(), 'de1')
                .condition
        ).toBeUndefined()
    })

    it('opens on "Filter" when a condition string is persisted', async () => {
        await renderTab({ de1: { condition: 'LIKE:foo' } })

        expect(screen.getByRole('radio', { name: 'Filter' })).toBeChecked()
        expect(screen.getByTestId('alphanumeric-condition')).toBeInTheDocument()
    })

    it('discards the condition on save under "Show all" but restores it on toggle back', async () => {
        const user = userEvent.setup()
        const { store } = await renderTab({ de1: { condition: 'LIKE:foo' } })

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

    it('shows a disabled "Filter" with help text for an unfilterable dimension', async () => {
        await renderTab({}, unfilterableDimension)

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

    it('keeps the Filter legend hidden when there is no Grouping select', async () => {
        await renderTab()

        expect(
            screen.queryByTestId('conditions-de1-filter-radio-heading')
        ).not.toBeInTheDocument()
    })
})

describe('ConditionsTabContent — Grouping select', () => {
    it('renders Grouping cards (defaulting to "No grouping") for a numeric dim with legend sets', async () => {
        await renderTab({}, numericDimension, numericQueryData)

        expect(
            await screen.findByRole('radio', { name: 'No grouping' })
        ).toBeChecked()
        expect(
            screen.getByRole('radio', { name: 'Weight legends' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('radio', { name: 'Age legends' })
        ).toBeInTheDocument()
    })

    it('shows a sorted legend-band preview as the card subtitle, truncated with a remaining count', async () => {
        await renderTab({}, numericDimension, numericQueryData)

        expect(
            await screen.findByText('0-10, 10-20, 20-30, and 2 more')
        ).toBeInTheDocument()
    })

    it('does not render the Grouping radios when the dimension has no legend sets', async () => {
        await renderTab({}, numericDimension, {
            dataElements: { legendSets: [] },
        })

        await screen.findByRole('radio', { name: 'Show all values' })

        expect(screen.queryByTestId('grouping-select')).not.toBeInTheDocument()
    })

    it('groups the dimension when a legend set radio is chosen, relabelling Show all and keeping it selected', async () => {
        const user = userEvent.setup()
        const { store } = await renderTab(
            {},
            numericDimension,
            numericQueryData
        )

        await user.click(
            await screen.findByRole('radio', { name: 'Weight legends' })
        )

        expect(
            getVisUiConfigConditionsByDimension(store.getState(), 'numeric-de')
                .legendSet
        ).toBe('LEGEND_SET_1')
        expect(
            screen.queryByRole('radio', { name: 'Show all values' })
        ).not.toBeInTheDocument()
        expect(
            screen.getByRole('radio', { name: 'Show all groups' })
        ).toBeChecked()
    })

    it('clears grouping when the "No grouping" card is chosen', async () => {
        const user = userEvent.setup()
        const { store } = await renderTab(
            { 'numeric-de': { legendSet: 'LEGEND_SET_1' } },
            numericDimension,
            numericQueryData
        )

        await user.click(
            await screen.findByRole('radio', { name: 'No grouping' })
        )

        expect(
            getVisUiConfigConditionsByDimension(store.getState(), 'numeric-de')
                .legendSet
        ).toBeUndefined()
    })

    it('nukes existing operator conditions when grouping is switched on', async () => {
        const user = userEvent.setup()
        const { store } = await renderTab(
            { 'numeric-de': { condition: 'GT:5' } },
            numericDimension,
            numericQueryData
        )

        await user.click(
            await screen.findByRole('radio', { name: 'Weight legends' })
        )

        const conditions = getVisUiConfigConditionsByDimension(
            store.getState(),
            'numeric-de'
        )
        expect(conditions.legendSet).toBe('LEGEND_SET_1')
        expect(conditions.condition).toBeFalsy()
    })
})

describe('ConditionsTabContent — numeric filter operators', () => {
    it('filters by band selection in a Transfer when grouped', async () => {
        const user = userEvent.setup()
        const { store } = await renderTab(
            { 'numeric-de': { legendSet: 'LEGEND_SET_1' } },
            numericDimension,
            numericQueryData
        )

        await user.click(await screen.findByRole('radio', { name: 'Filter' }))
        // grouped → bands are picked in a Transfer; double-click moves one over
        await user.dblClick(await screen.findByText('Low'))

        await waitFor(() =>
            expect(
                getVisUiConfigConditionsByDimension(
                    store.getState(),
                    'numeric-de'
                ).condition
            ).toBe('IN:LEGEND_1')
        )
    })

    it('uses comparison operators when not grouped', async () => {
        const user = userEvent.setup()
        const { store } = await renderTab(
            {},
            numericDimension,
            numericQueryData
        )

        await user.click(await screen.findByRole('radio', { name: 'Filter' }))
        await user.click(screen.getByText('Choose a filter type'))

        await user.click(screen.getByText('greater than (>)'))
        await user.type(screen.getByRole('spinbutton'), '5')

        await waitFor(() =>
            expect(
                getVisUiConfigConditionsByDimension(
                    store.getState(),
                    'numeric-de'
                ).condition
            ).toBe('GT:5')
        )
    })
})

describe('ConditionsTabContent — value input focus', () => {
    it('focuses the value input after an operator is chosen', async () => {
        const user = userEvent.setup()
        await renderTab()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))
        await user.click(screen.getByText('Choose a filter type'))
        await user.click(screen.getByText('contains'))

        await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus())
    })

    it('does not steal focus when a condition is restored with an operator', async () => {
        await renderTab({ de1: { condition: 'LIKE:foo' } })

        expect(screen.getByDisplayValue('foo')).not.toHaveFocus()
    })
})
