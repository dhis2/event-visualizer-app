import { getCurrentVis } from '@store/current-vis-slice'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import {
    initialState as visUiConfigInitialState,
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
}

const customValue: CustomValueObject = {
    id: 's1.de1',
    aggregationType: 'AVERAGE',
}

const buildMockOptions = ({
    currentVisOverride,
    outputType = 'EVENT',
    customValue: configuredCustomValue,
}: {
    currentVisOverride: Partial<CurrentVisualization>
    outputType?: OutputType
    customValue?: CustomValueObject
}): MockOptions => ({
    metadata,
    partialStore: {
        preloadedState: deepmerge(
            {
                visUiConfig: deepmerge(visUiConfigInitialState, {
                    outputType,
                    visualizationType: 'PIVOT_TABLE',
                    layout: { columns: ['s1.de1'] },
                    customValue: configuredCustomValue,
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
