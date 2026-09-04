import { setUiActiveDimensionModal, uiSlice } from '@store/ui-slice'
import {
    addVisUiConfigLayoutDimension,
    addVisUiConfigLayoutDimensions,
    getVisUiConfigConditionsByDimension,
    initialState,
    visUiConfigSlice,
    type ConditionsObject,
} from '@store/vis-ui-config-slice'
import { type MockOptions, renderWithAppWrapper } from '@test-utils/app-wrapper'
import { waitFor } from '@testing-library/react'
import type { VisualizationType } from '@types'
import { describe, it, expect } from 'vitest'

const NUMERIC_DIMENSION_ID = 'numeric-de'
const TEXT_DIMENSION_ID = 'text-de'

const metadata: MockOptions['metadata'] = {
    [NUMERIC_DIMENSION_ID]: {
        id: NUMERIC_DIMENSION_ID,
        dimensionId: 'numeric-de',
        name: 'My numeric element',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
    },
    [TEXT_DIMENSION_ID]: {
        id: TEXT_DIMENSION_ID,
        dimensionId: 'text-de',
        name: 'My text element',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    },
}

const legendSets = [
    { id: 'LEGEND_SET_1', name: 'Weight legends', legends: [] },
    { id: 'LEGEND_SET_2', name: 'Age legends', legends: [] },
]

const setupStoreWithListener = async ({
    visualizationType = 'PIVOT_TABLE',
    conditionsByDimension = {},
}: {
    visualizationType?: VisualizationType
    conditionsByDimension?: Record<string, ConditionsObject | undefined>
} = {}) => {
    const { store } = await renderWithAppWrapper(<div />, {
        metadata,
        queryData: { dataElements: async () => ({ legendSets }) },
        partialStore: {
            reducer: {
                visUiConfig: visUiConfigSlice.reducer,
                ui: uiSlice.reducer,
            },
            preloadedState: {
                visUiConfig: {
                    ...initialState,
                    visualizationType,
                    conditionsByDimension,
                },
                ui: uiSlice.getInitialState(),
            },
        },
    })

    return store
}

const getLegendSet = (
    store: Awaited<ReturnType<typeof setupStoreWithListener>>,
    dimensionId = NUMERIC_DIMENSION_ID
) =>
    getVisUiConfigConditionsByDimension(store.getState(), dimensionId).legendSet

describe('default grouping selection', () => {
    it('selects the first legend set when a dimension is added to a pivot table', async () => {
        const store = await setupStoreWithListener()

        store.dispatch(
            addVisUiConfigLayoutDimension({
                axis: 'columns',
                dimensionId: NUMERIC_DIMENSION_ID,
            })
        )

        await waitFor(() => expect(getLegendSet(store)).toBe('LEGEND_SET_1'))
    })

    it('selects the first legend set when the dimension modal is opened', async () => {
        const store = await setupStoreWithListener()

        store.dispatch(setUiActiveDimensionModal(NUMERIC_DIMENSION_ID))

        await waitFor(() => expect(getLegendSet(store)).toBe('LEGEND_SET_1'))
    })

    it('applies to every dimension of a multi-dimension add', async () => {
        const store = await setupStoreWithListener()

        store.dispatch(
            addVisUiConfigLayoutDimensions({
                axis: 'columns',
                dimensionIds: [NUMERIC_DIMENSION_ID, TEXT_DIMENSION_ID],
            })
        )

        await waitFor(() => expect(getLegendSet(store)).toBe('LEGEND_SET_1'))
        expect(getLegendSet(store, TEXT_DIMENSION_ID)).toBeUndefined()
    })

    it('selects nothing in a line list', async () => {
        const store = await setupStoreWithListener({
            visualizationType: 'LINE_LIST',
        })

        store.dispatch(setUiActiveDimensionModal(NUMERIC_DIMENSION_ID))

        await waitFor(() =>
            expect(store.getState().ui.activeDimensionModal).toBe(
                NUMERIC_DIMENSION_ID
            )
        )
        expect(getLegendSet(store)).toBeUndefined()
    })

    it('leaves an existing choice of no grouping alone', async () => {
        const store = await setupStoreWithListener({
            conditionsByDimension: { [NUMERIC_DIMENSION_ID]: undefined },
        })

        store.dispatch(setUiActiveDimensionModal(NUMERIC_DIMENSION_ID))

        await waitFor(() =>
            expect(store.getState().ui.activeDimensionModal).toBe(
                NUMERIC_DIMENSION_ID
            )
        )
        expect(getLegendSet(store)).toBeUndefined()
    })

    it('leaves an existing legend set alone', async () => {
        const store = await setupStoreWithListener({
            conditionsByDimension: {
                [NUMERIC_DIMENSION_ID]: { legendSet: 'LEGEND_SET_2' },
            },
        })

        store.dispatch(setUiActiveDimensionModal(NUMERIC_DIMENSION_ID))

        await waitFor(() =>
            expect(store.getState().ui.activeDimensionModal).toBe(
                NUMERIC_DIMENSION_ID
            )
        )
        expect(getLegendSet(store)).toBe('LEGEND_SET_2')
    })
})
