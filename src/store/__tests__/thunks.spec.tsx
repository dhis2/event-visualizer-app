import { getLastUsedVisualizationTypeFromLocalStorage } from '@modules/visualization/local-storage'
import { getCurrentVis } from '@store/current-vis-slice'
import {
    tSetCustomValue,
    tUpdateCurrentVisFromVisUiConfig,
} from '@store/thunks'
import {
    getVisUiConfigCustomValue,
    initialState as visUiConfigInitialState,
    setVisUiConfigCustomValueAggregationType,
    type CustomValueObject,
} from '@store/vis-ui-config-slice'
import {
    renderHookWithAppWrapper,
    type MockOptions,
} from '@test-utils/app-wrapper'
import type { CurrentVisualization, OutputType, RootState } from '@types'
import deepmerge from 'deepmerge'
import { describe, it, expect } from 'vitest'

const stage1 = {
    id: 's1',
    name: 'Stage 1',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'p1' },
}
const metadata = {
    p1: {
        id: 'p1',
        name: 'Program 1',
        programType: 'WITH_REGISTRATION',
        programStages: [stage1],
        trackedEntityType: { id: 'tet1', name: 'Person' },
    },
    tet1: { id: 'tet1', name: 'Person' },
    s1: stage1,
    's1.de1': {
        id: 's1.de1',
        name: 'DE 1',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
    },
    's1.de2': {
        id: 's1.de2',
        name: 'DE 2',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
    },
}

const customValue: CustomValueObject = {
    id: 's1.de1',
    aggregationType: 'AVERAGE',
}

const buildMockOptions = ({
    currentVisOverride,
    outputType = 'EVENT',
    customValue: configuredCustomValue,
    conditionsByDimension = {},
    queryData,
}: {
    currentVisOverride: Partial<CurrentVisualization>
    outputType?: OutputType
    customValue?: CustomValueObject
    conditionsByDimension?: RootState['visUiConfig']['conditionsByDimension']
    queryData?: MockOptions['queryData']
}): MockOptions => ({
    metadata,
    queryData,
    partialStore: {
        preloadedState: deepmerge(
            {
                visUiConfig: deepmerge(visUiConfigInitialState, {
                    outputType,
                    visualizationType: 'PIVOT_TABLE',
                    layout: { columns: ['s1.de1'] },
                    customValue: configuredCustomValue,
                    conditionsByDimension,
                }),
            } as Partial<RootState>,
            { currentVis: currentVisOverride } as Partial<RootState>
        ),
    },
})

const customValueVis: Partial<CurrentVisualization> = {
    type: 'PIVOT_TABLE',
    outputType: 'EVENT',
    columns: [{ dimension: 's1.de1' }],
    value: { id: 's1.de1' },
    aggregationType: 'AVERAGE',
}

const eventVis: Partial<CurrentVisualization> = {
    type: 'PIVOT_TABLE',
    outputType: 'EVENT',
    columns: [{ dimension: 's1.de1' }],
}

describe('tUpdateCurrentVisFromVisUiConfig', () => {
    it('stores the applied visualization type as the last used one', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions({ currentVisOverride: eventVis })
        )

        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        expect(getLastUsedVisualizationTypeFromLocalStorage()).toBe(
            'PIVOT_TABLE'
        )
    })

    it('clears the value when no cell value is set', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions({ currentVisOverride: customValueVis })
        )

        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        expect(getCurrentVis(store.getState()).value).toBeUndefined()
    })

    it('applies the cell value', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions({
                currentVisOverride: eventVis,
                customValue,
            })
        )

        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        const currentVis = getCurrentVis(store.getState())
        expect(currentVis.value).toEqual({ id: 's1.de1' })
        expect(currentVis.aggregationType).toBe('AVERAGE')
    })

    it('applies the cell value for TRACKED_ENTITY_INSTANCE', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions({
                currentVisOverride: eventVis,
                outputType: 'TRACKED_ENTITY_INSTANCE',
                customValue,
            })
        )

        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        expect(getCurrentVis(store.getState()).value).toEqual({ id: 's1.de1' })
    })

    it('applies the cell value for ENROLLMENT', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions({
                currentVisOverride: eventVis,
                outputType: 'ENROLLMENT',
                customValue,
            })
        )

        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        expect(getCurrentVis(store.getState()).value).toEqual({ id: 's1.de1' })
    })
})

describe('the cell value filter', () => {
    const weightValue: CustomValueObject = {
        id: 's1.de2',
        aggregationType: 'SUM',
    }

    it('is sent as a filter dimension', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions({
                currentVisOverride: eventVis,
                customValue: weightValue,
                conditionsByDimension: { 's1.de2': { condition: 'GT:5' } },
            })
        )

        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        expect(getCurrentVis(store.getState()).filters).toEqual([
            expect.objectContaining({
                dimension: 'de2',
                filter: 'GT:5',
                programStage: { id: 's1' },
            }),
        ])
    })

    it('adds no filter dimension when the cell value is not filtered', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions({
                currentVisOverride: eventVis,
                customValue: weightValue,
            })
        )

        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        expect(getCurrentVis(store.getState()).filters).toEqual([])
    })
})

describe('tSetCustomValue', () => {
    const renderWithItemAggregationType = (aggregationType: string) =>
        renderHookWithAppWrapper(
            () => null,
            buildMockOptions({
                currentVisOverride: eventVis,
                queryData: { dataElements: { aggregationType } },
            })
        )

    it('uses the item default when the item has one', async () => {
        const { store } = await renderWithItemAggregationType('SUM')

        await store.dispatch(tSetCustomValue('s1.de2'))

        expect(getVisUiConfigCustomValue(store.getState())).toEqual({
            id: 's1.de2',
            aggregationType: 'DEFAULT',
        })
    })

    it('falls back to average when the item default is NONE', async () => {
        const { store } = await renderWithItemAggregationType('NONE')

        await store.dispatch(tSetCustomValue('s1.de2'))

        expect(getVisUiConfigCustomValue(store.getState())).toEqual({
            id: 's1.de2',
            aggregationType: 'AVERAGE',
        })
    })

    it('keeps an aggregation chosen while the item was loading', async () => {
        const { store } = await renderWithItemAggregationType('NONE')
        const pending = store.dispatch(tSetCustomValue('s1.de2'))
        store.dispatch(setVisUiConfigCustomValueAggregationType('MAX'))

        await pending

        expect(
            getVisUiConfigCustomValue(store.getState())?.aggregationType
        ).toBe('MAX')
    })
})
