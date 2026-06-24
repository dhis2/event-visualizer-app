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
    { id: 'LEGEND_SET_1', name: 'Weight legends' },
    { id: 'LEGEND_SET_2', name: 'Age legends' },
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

    it('keeps the Filter legend hidden when there is no Display section', async () => {
        await renderTab()

        expect(
            screen.queryByTestId('conditions-de1-filter-radio-heading')
        ).not.toBeInTheDocument()
    })
})

describe('ConditionsTabContent — Display axis', () => {
    it('renders a Display section above the Filter for a numeric dim with legend sets', async () => {
        await renderTab({}, numericDimension, numericQueryData)

        const exactRadio = await screen.findByRole('radio', {
            name: 'Exact values',
        })
        const groupRadio = screen.getByRole('radio', {
            name: 'Group into ranges',
        })
        const showAllRadio = screen.getByRole('radio', {
            name: 'Show all values',
        })

        expect(exactRadio).toBeInTheDocument()
        expect(groupRadio).toBeInTheDocument()
        // Display radios precede the Filter radios in the DOM
        expect(
            exactRadio.compareDocumentPosition(showAllRadio) &
                Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy()
    })

    it('pairs the Display section with a visible "Filter" heading', async () => {
        await renderTab({}, numericDimension, numericQueryData)

        expect(
            await screen.findByTestId(
                'conditions-numeric-de-filter-radio-heading'
            )
        ).toHaveTextContent('Filter')
    })

    it('does not render the Display section when the dimension has no legend sets', async () => {
        await renderTab({}, numericDimension, {
            dataElements: { legendSets: [] },
        })

        // the Filter radio is always present; wait for it before asserting absence
        await screen.findByRole('radio', { name: 'Show all values' })

        expect(
            screen.queryByRole('radio', { name: 'Group into ranges' })
        ).not.toBeInTheDocument()
    })

    it('opens grouped with the Filter on "Show all" when only a legendSet is persisted', async () => {
        await renderTab(
            { 'numeric-de': { legendSet: 'LEGEND_SET_1' } },
            numericDimension,
            numericQueryData
        )

        expect(
            await screen.findByRole('radio', { name: 'Group into ranges' })
        ).toBeChecked()
        expect(
            screen.getByRole('radio', { name: 'Show all values' })
        ).toBeChecked()
    })

    it('keeps the legendSet when toggling the Filter Show all/Filter in group mode', async () => {
        const user = userEvent.setup()
        const { store } = await renderTab(
            {},
            numericDimension,
            numericQueryData
        )

        await user.click(
            await screen.findByRole('radio', { name: 'Group into ranges' })
        )

        const grouped = () =>
            getVisUiConfigConditionsByDimension(store.getState(), 'numeric-de')

        expect(grouped().legendSet).toBe('LEGEND_SET_1')
        expect(
            screen.getByRole('radio', { name: 'Show all values' })
        ).toBeChecked()

        await user.click(screen.getByRole('radio', { name: 'Filter' }))
        await user.click(screen.getByRole('radio', { name: 'Show all values' }))

        expect(grouped().legendSet).toBe('LEGEND_SET_1')
        expect(grouped().condition).toBeFalsy()
    })

    it('drops the legendSet when switching the Display back to exact values', async () => {
        const user = userEvent.setup()
        const { store } = await renderTab(
            { 'numeric-de': { legendSet: 'LEGEND_SET_1' } },
            numericDimension,
            numericQueryData
        )

        await user.click(
            await screen.findByRole('radio', { name: 'Exact values' })
        )

        expect(
            getVisUiConfigConditionsByDimension(store.getState(), 'numeric-de')
                .legendSet
        ).toBeUndefined()
    })

    it('shows the band Transfer (not operator rows) in group mode with a filter', async () => {
        await renderTab(
            {
                'numeric-de': {
                    legendSet: 'LEGEND_SET_1',
                    condition: 'IN:LEGEND_1',
                },
            },
            numericDimension,
            numericQueryData
        )

        expect(
            await screen.findByTestId('band-filter-transfer')
        ).toBeInTheDocument()
        expect(
            screen.queryByText('Choose a filter type')
        ).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Add filter' })
        ).not.toBeInTheDocument()
    })
})

describe('ConditionsTabContent — numeric operator filter (exact)', () => {
    it('offers no preset-options or legend-set entry in the operator select', async () => {
        const user = userEvent.setup()
        await renderTab({}, numericDimension, numericQueryData)

        await user.click(await screen.findByRole('radio', { name: 'Filter' }))
        await user.click(screen.getByText('Choose a filter type'))

        expect(screen.getByText('greater than (>)')).toBeInTheDocument()
        expect(
            screen.queryByText('is one of preset options')
        ).not.toBeInTheDocument()
        expect(
            screen.queryByText('Choose a legend set')
        ).not.toBeInTheDocument()
    })

    it('persists an operator + value condition', async () => {
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
