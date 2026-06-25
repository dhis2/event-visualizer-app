import {
    visUiConfigSlice,
    initialState as visUiConfigInitialState,
    type VisUiConfigState,
    type CustomValueObject,
} from '@store/vis-ui-config-slice'
import {
    renderHookWithAppWrapper,
    type MockOptions,
} from '@test-utils/app-wrapper'
import { createDeferredQuery } from '@test-utils/deferred-query'
import { waitFor } from '@testing-library/react'
import type { RootState } from '@types'
import deepmerge from 'deepmerge'
import { describe, it, expect } from 'vitest'
import { useCustomValueItems } from '../use-custom-value-items'

const ANALYTICS_RESOURCE = 'analytics/enrollments/aggregate/dimensions'

const stage1 = {
    id: 's1',
    name: 'Stage 1',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'p1' },
}
const stage2 = {
    id: 's2',
    name: 'Stage 2',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'p1' },
}
const metadata = {
    p1: {
        id: 'p1',
        name: 'Program 1',
        programType: 'WITH_REGISTRATION',
        programStages: [stage1, stage2],
        trackedEntityType: { id: 'tet1', name: 'Person' },
    },
    p2: {
        id: 'p2',
        name: 'Program 2',
        programType: 'WITH_REGISTRATION',
        programStages: [],
    },
    s1: stage1,
    s2: stage2,
    'p1.enrollmentDate': {
        id: 'p1.enrollmentDate',
        name: 'Enrollment Date',
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
    's1.de1': {
        id: 's1.de1',
        name: 'DE 1',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
    },
    's2.de2': {
        id: 's2.de2',
        name: 'DE 2',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
    },
    'p2.enrollmentDate': {
        id: 'p2.enrollmentDate',
        name: 'Enrollment Date P2',
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
}

const analyticsResponse = {
    dimensions: [
        {
            id: 's1.de1',
            name: 'DE 1',
            aggregationType: 'SUM',
            dimensionType: 'DATA_ELEMENT',
        },
        {
            id: 's2.de2',
            name: 'DE 2',
            aggregationType: 'AVERAGE',
            dimensionType: 'DATA_ELEMENT',
        },
    ],
}

const initialPreloadedState: Partial<RootState> = {
    visUiConfig: visUiConfigInitialState,
}

const buildMockOptions = (
    layoutOverride: Partial<VisUiConfigState['layout']>,
    customValue?: CustomValueObject
) => ({
    metadata,
    queryData: {
        [ANALYTICS_RESOURCE]: analyticsResponse,
    },
    partialStore: {
        reducer: { visUiConfig: visUiConfigSlice.reducer },
        preloadedState: deepmerge(initialPreloadedState, {
            visUiConfig: {
                layout: {
                    ...visUiConfigInitialState.layout,
                    ...layoutOverride,
                },
                customValue,
            },
        }),
    },
})

/* The hook's three precondition throws (0 / >1 programs, >1 stages) are not
 * exercised here. They fire from inside React render so RTL surfaces them
 * as uncaught exceptions rather than rejected promises, which requires an
 * error-boundary wrapper to assert cleanly. Those states are upstream-gated
 * by `useActionButton` — that's the appropriate test surface. */
describe('useCustomValueItems', () => {
    it('attaches stageName when the layout has no program stage and dimensions span multiple stages', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueItems(),
            buildMockOptions({ columns: ['p1.enrollmentDate'] })
        )

        await waitFor(() => {
            expect(result.current.items).toBeDefined()
        })

        expect(result.current.items).toEqual([
            {
                id: 's1.de1',
                name: 'DE 1',
                aggregationType: 'SUM',
                dimensionType: 'DATA_ELEMENT',
                stageName: 'Stage 1',
            },
            {
                id: 's2.de2',
                name: 'DE 2',
                aggregationType: 'AVERAGE',
                dimensionType: 'DATA_ELEMENT',
                stageName: 'Stage 2',
            },
        ])
        expect(result.current.filteredByStageName).toBeUndefined()
    })

    it('sorts data items alphabetically by name regardless of API order', async () => {
        const outOfOrderResponse = {
            dimensions: [
                {
                    id: 's2.de2',
                    name: 'DE 2',
                    aggregationType: 'AVERAGE',
                    dimensionType: 'DATA_ELEMENT',
                },
                {
                    id: 's1.de1',
                    name: 'DE 1',
                    aggregationType: 'SUM',
                    dimensionType: 'DATA_ELEMENT',
                },
            ],
        }
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueItems(),
            {
                ...buildMockOptions({ columns: ['p1.enrollmentDate'] }),
                queryData: {
                    [ANALYTICS_RESOURCE]: outOfOrderResponse,
                },
            }
        )

        await waitFor(() => {
            expect(result.current.items).toBeDefined()
        })

        expect(result.current.items?.map((item) => item.name)).toEqual([
            'DE 1',
            'DE 2',
        ])
    })

    it('omits stageName when the layout has no program stage and the program has only one stage', async () => {
        const singleStage = {
            id: 'sX',
            name: 'Stage X',
            repeatable: false,
            hideDueDate: false,
            program: { id: 'pSingle' },
        }
        const singleStageMetadata = {
            pSingle: {
                id: 'pSingle',
                name: 'Single-stage program',
                programType: 'WITH_REGISTRATION',
                programStages: [singleStage],
            },
            sX: singleStage,
            'pSingle.enrollmentDate': {
                id: 'pSingle.enrollmentDate',
                name: 'Enrollment Date (single)',
                dimensionType: 'PERIOD',
                valueType: 'DATE',
            },
            'sX.de1': {
                id: 'sX.de1',
                name: 'DE 1',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'NUMBER',
            },
            'sX.deOther': {
                id: 'sX.deOther',
                name: 'DE Other',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'NUMBER',
            },
        }
        const singleStageResponse = {
            dimensions: [
                {
                    id: 'sX.de1',
                    name: 'DE 1',
                    aggregationType: 'SUM',
                    dimensionType: 'DATA_ELEMENT',
                },
                {
                    id: 'sX.deOther',
                    name: 'DE Other',
                    aggregationType: 'AVERAGE',
                    dimensionType: 'DATA_ELEMENT',
                },
            ],
        }
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueItems(),
            {
                ...buildMockOptions({ columns: ['pSingle.enrollmentDate'] }),
                metadata: singleStageMetadata,
                queryData: {
                    [ANALYTICS_RESOURCE]: singleStageResponse,
                },
            }
        )

        await waitFor(() => {
            expect(result.current.items).toBeDefined()
        })

        expect(result.current.items).toEqual([
            {
                id: 'sX.de1',
                name: 'DE 1',
                aggregationType: 'SUM',
                dimensionType: 'DATA_ELEMENT',
            },
            {
                id: 'sX.deOther',
                name: 'DE Other',
                aggregationType: 'AVERAGE',
                dimensionType: 'DATA_ELEMENT',
            },
        ])
    })

    it('filters by stage and exposes the layout stage name when one stage is in the layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueItems(),
            buildMockOptions({ columns: ['s1.de1'] })
        )

        await waitFor(() => {
            expect(result.current.items).toBeDefined()
        })

        expect(result.current.items).toEqual([
            {
                id: 's1.de1',
                name: 'DE 1',
                aggregationType: 'SUM',
                dimensionType: 'DATA_ELEMENT',
            },
        ])
        expect(result.current.filteredByStageName).toBe('Stage 1')
    })

    it('flags customValueStageMismatch when the custom value stage differs from the layout stage', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueItems(),
            buildMockOptions(
                { columns: ['s1.de1'] },
                { id: 's2.de2', aggregationType: 'SUM' }
            )
        )

        await waitFor(() => {
            expect(result.current.items).toBeDefined()
        })

        expect(result.current.customValueStageMismatch).toBe(true)
    })

    it('does not flag a mismatch when the custom value stage matches the layout stage', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueItems(),
            buildMockOptions(
                { columns: ['s1.de1'] },
                { id: 's1.de1', aggregationType: 'SUM' }
            )
        )

        await waitFor(() => {
            expect(result.current.items).toBeDefined()
        })

        expect(result.current.customValueStageMismatch).toBe(false)
    })

    it('does not flag a mismatch when there is no layout stage', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueItems(),
            buildMockOptions(
                { columns: ['p1.enrollmentDate'] },
                { id: 's1.de1', aggregationType: 'SUM' }
            )
        )

        await waitFor(() => {
            expect(result.current.items).toBeDefined()
        })

        expect(result.current.customValueStageMismatch).toBe(false)
    })

    it('includes program attributes and labels them with the tracked entity type name when no stage is in the layout', async () => {
        const responseWithAttribute = {
            dimensions: [
                {
                    id: 's1.de1',
                    name: 'DE 1',
                    aggregationType: 'SUM',
                    dimensionType: 'DATA_ELEMENT',
                },
                {
                    id: 'attr1',
                    name: 'Age',
                    aggregationType: 'NONE',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                },
            ],
        }
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueItems(),
            {
                ...buildMockOptions({ columns: ['p1.enrollmentDate'] }),
                queryData: {
                    [ANALYTICS_RESOURCE]: responseWithAttribute,
                },
            }
        )

        await waitFor(() => {
            expect(result.current.items).toBeDefined()
        })

        expect(result.current.items).toEqual([
            {
                id: 'attr1',
                name: 'Age',
                aggregationType: 'NONE',
                dimensionType: 'PROGRAM_ATTRIBUTE',
                stageName: 'Person',
            },
            {
                id: 's1.de1',
                name: 'DE 1',
                aggregationType: 'SUM',
                dimensionType: 'DATA_ELEMENT',
                stageName: 'Stage 1',
            },
        ])
    })

    it('keeps program attributes but filters out other stages when one stage is in the layout', async () => {
        const responseWithAttribute = {
            dimensions: [
                {
                    id: 's1.de1',
                    name: 'DE 1',
                    aggregationType: 'SUM',
                    dimensionType: 'DATA_ELEMENT',
                },
                {
                    id: 's2.de2',
                    name: 'DE 2',
                    aggregationType: 'AVERAGE',
                    dimensionType: 'DATA_ELEMENT',
                },
                {
                    id: 'attr1',
                    name: 'Age',
                    aggregationType: 'NONE',
                    dimensionType: 'PROGRAM_ATTRIBUTE',
                },
            ],
        }
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueItems(),
            {
                ...buildMockOptions({ columns: ['s1.de1'] }),
                queryData: {
                    [ANALYTICS_RESOURCE]: responseWithAttribute,
                },
            }
        )

        await waitFor(() => {
            expect(result.current.items).toBeDefined()
        })

        expect(result.current.items).toEqual([
            {
                id: 'attr1',
                name: 'Age',
                aggregationType: 'NONE',
                dimensionType: 'PROGRAM_ATTRIBUTE',
                stageName: 'Person',
            },
            {
                id: 's1.de1',
                name: 'DE 1',
                aggregationType: 'SUM',
                dimensionType: 'DATA_ELEMENT',
            },
        ])
    })

    it('returns undefined items while loading', async () => {
        /* Hold the dimensions request in flight so the loading assertion is
         * deterministic. Without this, the query can resolve during the
         * wrapper's internal store wait, flipping isLoading to false before
         * the assertion under full-suite load. */
        const deferredDimensions = createDeferredQuery()
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueItems(),
            {
                ...buildMockOptions({ columns: ['p1.enrollmentDate'] }),
                queryData: {
                    [ANALYTICS_RESOURCE]: deferredDimensions.defer(
                        () => analyticsResponse
                    ),
                } as MockOptions['queryData'],
            }
        )

        expect(result.current.isLoading).toBe(true)
        expect(result.current.items).toBeUndefined()

        await deferredDimensions.releaseAll()
        await waitFor(() => {
            expect(result.current.items).toBeDefined()
        })
    })
})
