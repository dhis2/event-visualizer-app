import { getCurrentVis } from '@store/current-vis-slice'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import { initialState as visUiConfigInitialState } from '@store/vis-ui-config-slice'
import {
    renderHookWithAppWrapper,
    type MockOptions,
} from '@test-utils/app-wrapper'
import type { CurrentVisualization, RootState } from '@types'
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
    },
    s1: stage1,
    's1.de1': {
        id: 's1.de1',
        name: 'DE 1',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
    },
}

const customValue = { id: 's1.de1', aggregationType: 'AVERAGE' as const }

const buildMockOptions = (
    currentVisOverride: Partial<CurrentVisualization>,
    outputType = 'EVENT'
): MockOptions => ({
    metadata,
    partialStore: {
        preloadedState: deepmerge(
            {
                visUiConfig: deepmerge(visUiConfigInitialState, {
                    outputType,
                    visualizationType: 'PIVOT_TABLE',
                    layout: { columns: ['s1.de1'] },
                    customValue,
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
    it('clears the value when rebuilding in EVENT mode, keeping customValue remembered', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions(customValueVis)
        )

        store.dispatch(tUpdateCurrentVisFromVisUiConfig(false))

        expect(getCurrentVis(store.getState()).value).toBeUndefined()
        // The remembered selection survives the switch to the event table
        expect(store.getState().visUiConfig.customValue).toEqual(customValue)
    })

    it('restores the value from the remembered customValue when rebuilding in CUSTOM_VALUE mode', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions(eventVis)
        )

        store.dispatch(tUpdateCurrentVisFromVisUiConfig(true))

        const currentVis = getCurrentVis(store.getState())
        expect(currentVis.value).toEqual({ id: 's1.de1' })
        expect(currentVis.aggregationType).toBe('AVERAGE')
    })

    it('preserves the current mode when withCustomValue is not passed', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions(customValueVis)
        )

        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        expect(getCurrentVis(store.getState()).value).toEqual({ id: 's1.de1' })
    })

    it('drops the value for a non-EVENT output type even when withCustomValue is true', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions(customValueVis, 'ENROLLMENT')
        )

        // Even explicitly asking for a custom value must not add one when
        // the output type is not EVENT.
        store.dispatch(tUpdateCurrentVisFromVisUiConfig(true))

        expect(getCurrentVis(store.getState()).value).toBeUndefined()
        expect(store.getState().visUiConfig.customValue).toEqual(customValue)
    })
})
