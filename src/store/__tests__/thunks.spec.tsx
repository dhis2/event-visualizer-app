import { FetchError } from '@dhis2/app-runtime'
import eventPivotTableAttributeValue from '@modules/visualization/__fixtures__/round-trip/saved/event-pivot-table-attribute-value.json'
import { getLastUsedVisualizationTypeFromLocalStorage } from '@modules/visualization/local-storage'
import { getCurrentVis } from '@store/current-vis-slice'
import { getVisualizationLoadError } from '@store/loader-slice'
import {
    tClearVisualization,
    tLoadSavedVisualization,
    tUpdateCurrentVisFromVisUiConfig,
} from '@store/thunks'
import {
    clearVisUiConfigCellValue,
    initialState as visUiConfigInitialState,
    setVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import {
    renderHookWithAppWrapper,
    type MockOptions,
} from '@test-utils/app-wrapper'
import type { AppCachedData, CurrentVisualization, RootState } from '@types'
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

const cellValue = { id: 's1.de1', aggregationType: 'AVERAGE' as const }

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
                    cellValue,
                }),
            } as Partial<RootState>,
            { currentVis: currentVisOverride } as Partial<RootState>
        ),
    },
})

const cellValueVis: Partial<CurrentVisualization> = {
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
            buildMockOptions(eventVis)
        )

        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        expect(getLastUsedVisualizationTypeFromLocalStorage()).toBe(
            'PIVOT_TABLE'
        )
    })

    it('applies the remembered value to a pivot table', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions(eventVis)
        )

        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        const currentVis = getCurrentVis(store.getState())
        expect(currentVis.value).toEqual({
            id: 'de1',
            programStage: { id: 's1' },
        })
        expect(currentVis.aggregationType).toBe('AVERAGE')
    })

    it('applies the value for any output type', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions(cellValueVis, 'ENROLLMENT')
        )

        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        const currentVis = getCurrentVis(store.getState())
        expect(currentVis.value).toEqual({
            id: 'de1',
            programStage: { id: 's1' },
        })
        expect(currentVis.aggregationType).toBe('AVERAGE')
    })

    it('strips the value once it is cleared', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions(cellValueVis)
        )

        store.dispatch(clearVisUiConfigCellValue())
        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        const currentVis = getCurrentVis(store.getState())
        expect(currentVis.value).toBeUndefined()
        expect(currentVis.aggregationType).toBeUndefined()
    })

    it('resets the cell value when switching to a line list', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions(cellValueVis)
        )

        store.dispatch(setVisUiConfigVisualizationType('LINE_LIST'))
        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        expect(getCurrentVis(store.getState()).value).toBeUndefined()
        expect(store.getState().visUiConfig.cellValue).toBeUndefined()
    })

    /* Switching back must start from Count rather than restoring the cell
     * value the line list discarded. */
    it('does not bring the cell value back on the return to a pivot table', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions(cellValueVis)
        )

        store.dispatch(setVisUiConfigVisualizationType('LINE_LIST'))
        store.dispatch(setVisUiConfigVisualizationType('PIVOT_TABLE'))
        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        expect(store.getState().visUiConfig.cellValue).toBeUndefined()
        expect(getCurrentVis(store.getState()).value).toBeUndefined()
    })
})

/* The separator reaches the reducer through the action meta that
 * appCachedDataMiddleware stamps, so this needs the real store rather than a
 * hand-built action. 'SPACE' is the fixture's keyAnalysisDigitGroupSeparator. */
describe('tClearVisualization', () => {
    const withSeparator = (
        digitGroupSeparator: AppCachedData['systemSettings']['digitGroupSeparator']
    ) => ({
        partialStore: {
            preloadedState: {
                visUiConfig: deepmerge(visUiConfigInitialState, {
                    layout: { columns: ['s1.de1'] },
                    options: { digitGroupSeparator },
                }),
            } as Partial<RootState>,
        },
    })

    it('clears the cell value', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            buildMockOptions(cellValueVis)
        )

        expect(store.getState().visUiConfig.cellValue).toEqual(cellValue)

        store.dispatch(tClearVisualization())

        expect(store.getState().visUiConfig.cellValue).toBeUndefined()
    })

    it('restores the instance digit group separator', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            withSeparator('COMMA')
        )

        store.dispatch(tClearVisualization())

        expect(store.getState().visUiConfig.options.digitGroupSeparator).toBe(
            'SPACE'
        )
    })

    it('carries the separator into the rebuilt currentVis', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => null,
            withSeparator('COMMA')
        )

        store.dispatch(tClearVisualization())
        store.dispatch(tUpdateCurrentVisFromVisUiConfig())

        expect(getCurrentVis(store.getState()).digitGroupSeparator).toBe(
            'SPACE'
        )
    })
})

describe('tLoadSavedVisualization', () => {
    /* The value names no type, so its key comes from the metadata the load
     * registers, which has to be in the store by the time the ui config is
     * derived. */
    it('keys an attribute cell value under its tracked entity type', async () => {
        const { store } = await renderHookWithAppWrapper(() => null, {
            queryData: {
                eventVisualizations: () => eventPivotTableAttributeValue,
            },
        } as unknown as MockOptions)

        await store.dispatch(tLoadSavedVisualization({ id: 'TIuOzZ0ID0V' }))

        expect(getVisualizationLoadError(store.getState())).toBeNull()
        expect(store.getState().visUiConfig.cellValue?.id).toBe(
            'nEenWmSyUEp.OvY4VVhSDeJ'
        )
        expect(getCurrentVis(store.getState()).value).toEqual({
            id: 'OvY4VVhSDeJ',
        })
    })

    it('keeps a failed fetch as a fetch error instead of a runtime one', async () => {
        /* PluginWrapper rethrows a 'runtime' load error to the app-shell crash
         * screen, so a fetch failure tagged that way costs the user the
         * retryable canvas error. */
        const { store } = await renderHookWithAppWrapper(() => null, {
            queryData: {
                eventVisualizations: () => {
                    throw new FetchError({
                        type: 'unknown',
                        message:
                            'An unknown error occurred - Server Error (500)',
                        details: { httpStatusCode: 500 },
                    })
                },
            },
        } as unknown as MockOptions)

        await store.dispatch(tLoadSavedVisualization({ id: 'TIuOzZ0ID0V' }))

        expect(getVisualizationLoadError(store.getState())).toMatchObject({
            type: 'unknown',
            message: 'An unknown error occurred - Server Error (500)',
        })
    })
})
