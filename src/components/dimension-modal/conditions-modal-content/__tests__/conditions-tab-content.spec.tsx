import {
    visUiConfigSlice,
    initialState,
    getVisUiConfigConditionsByDimension,
    type ConditionsObject,
} from '@store/vis-ui-config-slice'
import { type MockOptions, renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen, waitFor, within } from '@testing-library/react'
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

const weightLegendSet = {
    id: 'LEGEND_SET_1',
    name: 'Weight legends',
    legends: [
        { id: 'LEGEND_1', name: 'Low', startValue: 0, endValue: 10 },
        { id: 'LEGEND_2', name: 'High', startValue: 11, endValue: 20 },
    ],
}

const ageLegendSet = {
    id: 'LEGEND_SET_2',
    name: 'Age legends',
    legends: [
        { id: 'LEGEND_3', name: '0 - 10', startValue: 0, endValue: 10 },
        { id: 'LEGEND_4', name: '10 - 20', startValue: 10, endValue: 20 },
        { id: 'LEGEND_5', name: '20 - 30', startValue: 20, endValue: 30 },
        { id: 'LEGEND_6', name: '30 - 40', startValue: 30, endValue: 40 },
    ],
}

type MockLegendSet = typeof weightLegendSet

const dataElementsWithLegendSets = (legendSets: MockLegendSet[]) => ({
    dataElements: async () => ({ legendSets }),
})

const renderTabContent = async (
    conditionsByDimension: Record<string, ConditionsObject | undefined> = {},
    dimension: DimensionMetadataItem = textDimension,
    queryData?: MockOptions['queryData']
) =>
    await renderWithAppWrapper(<ConditionsTabContent dimension={dimension} />, {
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
        await renderTabContent()

        expect(
            screen.getByRole('radio', { name: 'Show all values' })
        ).toBeChecked()
        expect(
            screen.queryByTestId('alphanumeric-condition')
        ).not.toBeInTheDocument()
    })

    it('seeds one editable condition row immediately when switching to Filter', async () => {
        const user = userEvent.setup()
        await renderTabContent()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(screen.getAllByTestId('alphanumeric-condition')).toHaveLength(1)
    })

    it('uses a single static "Add filter" label regardless of condition count', async () => {
        await renderTabContent({ de1: { condition: 'LIKE:foo:LIKE:bar' } })

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
        const { store } = await renderTabContent()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(
            getVisUiConfigConditionsByDimension(store.getState(), 'de1')
                .condition
        ).toBeUndefined()
    })

    it('opens on "Filter" when a condition string is persisted', async () => {
        await renderTabContent({ de1: { condition: 'LIKE:foo' } })

        expect(screen.getByRole('radio', { name: 'Filter' })).toBeChecked()
        expect(screen.getByTestId('alphanumeric-condition')).toBeInTheDocument()
    })

    it('discards the condition on save under "Show all" but restores it on toggle back', async () => {
        const user = userEvent.setup()
        const { store } = await renderTabContent({
            de1: { condition: 'LIKE:foo' },
        })

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
        await renderTabContent({}, unfilterableDimension)

        expect(
            screen.getByRole('radio', { name: 'Show all values' })
        ).toBeChecked()
        expect(screen.getByRole('radio', { name: /^Filter/ })).toBeDisabled()
        expect(
            screen.getByText('File type dimensions cannot be filtered.')
        ).toBeInTheDocument()
        expect(
            screen.queryByTestId('alphanumeric-condition')
        ).not.toBeInTheDocument()
    })
})

describe('ConditionsTabContent — grouping', () => {
    it('offers no grouping section when the data item has no legend sets', async () => {
        await renderTabContent(
            {},
            numericDimension,
            dataElementsWithLegendSets([])
        )

        expect(
            await screen.findByRole('radio', { name: 'Show all values' })
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('radio', { name: 'No grouping' })
        ).not.toBeInTheDocument()
        expect(screen.queryByText('Filtering')).not.toBeInTheDocument()
    })

    it('lists the legend sets in API order, with no grouping last', async () => {
        await renderTabContent(
            {},
            numericDimension,
            dataElementsWithLegendSets([weightLegendSet, ageLegendSet])
        )

        const grouping = await screen.findByRole('group', { name: 'Grouping' })

        expect(
            within(grouping)
                .getAllByRole('radio')
                .map((radio) => radio.getAttribute('value'))
        ).toEqual(['LEGEND_SET_1', 'LEGEND_SET_2', 'NO_GROUPING'])
    })

    it('offers a card per legend set, with the first legends as a subtitle', async () => {
        await renderTabContent(
            {},
            numericDimension,
            dataElementsWithLegendSets([weightLegendSet, ageLegendSet])
        )

        expect(
            await screen.findByRole('radio', { name: /^No grouping/ })
        ).toBeChecked()
        expect(
            screen.getByRole('radio', { name: /^Weight legends/ })
        ).toBeInTheDocument()
        expect(screen.getByText('Low, High')).toBeInTheDocument()
        expect(
            screen.getByText('0 - 10, 10 - 20, 20 - 30 and 1 more')
        ).toBeInTheDocument()
    })

    it('selects a grouping when its legend summary is clicked', async () => {
        const user = userEvent.setup()
        const { store } = await renderTabContent(
            {},
            numericDimension,
            dataElementsWithLegendSets([weightLegendSet])
        )

        await user.click(await screen.findByText('Low, High'))

        expect(
            getVisUiConfigConditionsByDimension(
                store.getState(),
                numericDimension.id
            ).legendSet
        ).toBe('LEGEND_SET_1')
    })

    it('shows the "Filtering" heading only when grouping is available', async () => {
        await renderTabContent(
            {},
            numericDimension,
            dataElementsWithLegendSets([weightLegendSet])
        )

        expect(await screen.findByText('Filtering')).toBeInTheDocument()
    })

    it('renames the show all option and filters by group once grouped', async () => {
        const user = userEvent.setup()
        const { store } = await renderTabContent(
            {},
            numericDimension,
            dataElementsWithLegendSets([weightLegendSet])
        )

        await user.click(
            await screen.findByRole('radio', { name: /^Weight legends/ })
        )

        expect(
            screen.getByRole('radio', { name: 'Show all groups' })
        ).toBeChecked()
        expect(
            getVisUiConfigConditionsByDimension(
                store.getState(),
                numericDimension.id
            ).legendSet
        ).toBe('LEGEND_SET_1')

        await user.click(screen.getByRole('radio', { name: 'Filter' }))

        expect(screen.getByText('Low')).toBeInTheDocument()
        expect(screen.getByText('High')).toBeInTheDocument()
    })

    it('opens on "Show all groups" when only a legend set is persisted', async () => {
        await renderTabContent(
            { [numericDimension.id]: { legendSet: 'LEGEND_SET_1' } },
            numericDimension,
            dataElementsWithLegendSets([weightLegendSet])
        )

        expect(
            await screen.findByRole('radio', { name: /^Weight legends/ })
        ).toBeChecked()
        expect(
            screen.getByRole('radio', { name: 'Show all groups' })
        ).toBeChecked()
    })

    it('discards the filter when the grouping changes', async () => {
        const user = userEvent.setup()
        const { store } = await renderTabContent(
            {
                [numericDimension.id]: {
                    condition: 'IN:LEGEND_1',
                    legendSet: 'LEGEND_SET_1',
                },
            },
            numericDimension,
            dataElementsWithLegendSets([weightLegendSet, ageLegendSet])
        )

        await user.click(
            await screen.findByRole('radio', { name: /^Age legends/ })
        )

        const conditions = getVisUiConfigConditionsByDimension(
            store.getState(),
            numericDimension.id
        )
        expect(conditions.legendSet).toBe('LEGEND_SET_2')
        expect(conditions.condition).toBeUndefined()
        expect(
            screen.getByRole('radio', { name: 'Show all groups' })
        ).toBeChecked()
    })

    it('discards the filter when grouping is turned off', async () => {
        const user = userEvent.setup()
        const { store } = await renderTabContent(
            {
                [numericDimension.id]: {
                    condition: 'IN:LEGEND_1',
                    legendSet: 'LEGEND_SET_1',
                },
            },
            numericDimension,
            dataElementsWithLegendSets([weightLegendSet])
        )

        await user.click(
            await screen.findByRole('radio', { name: /^No grouping/ })
        )

        expect(
            getVisUiConfigConditionsByDimension(
                store.getState(),
                numericDimension.id
            ).condition
        ).toBeUndefined()
        expect(
            screen.getByRole('radio', { name: 'Show all values' })
        ).toBeChecked()
    })
})

describe('ConditionsTabContent — value input focus', () => {
    it('focuses the value input after an operator is chosen', async () => {
        const user = userEvent.setup()
        await renderTabContent()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))
        await user.click(screen.getByText('Choose a filter type'))
        await user.click(screen.getByText('contains'))

        await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus())
    })

    it('does not steal focus when a condition is restored with an operator', async () => {
        await renderTabContent({ de1: { condition: 'LIKE:foo' } })

        expect(screen.getByDisplayValue('foo')).not.toHaveFocus()
    })
})
