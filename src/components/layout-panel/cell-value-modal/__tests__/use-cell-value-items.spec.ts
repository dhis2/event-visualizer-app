import {
    visUiConfigSlice,
    initialState as visUiConfigInitialState,
} from '@store/vis-ui-config-slice'
import {
    renderHookWithAppWrapper,
    type MockOptions,
} from '@test-utils/app-wrapper'
import { createDeferredQuery } from '@test-utils/deferred-query'
import { waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useCellValueItems } from '../use-cell-value-items'

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
const singleStage = {
    id: 'sX',
    name: 'Stage X',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'pSingle' },
}

const metadata = {
    p1: {
        id: 'p1',
        name: 'Program 1',
        programType: 'WITH_REGISTRATION',
        programStages: [stage1, stage2],
        trackedEntityType: { id: 'tet1', name: 'Person' },
    },
    pSingle: {
        id: 'pSingle',
        name: 'Single-stage program',
        programType: 'WITH_REGISTRATION',
        programStages: [singleStage],
    },
    s1: stage1,
    s2: stage2,
    sX: singleStage,
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

const buildMockOptions = (
    queryData: MockOptions['queryData'] = {
        [ANALYTICS_RESOURCE]: analyticsResponse,
    }
): MockOptions => ({
    metadata,
    queryData,
    partialStore: {
        reducer: { visUiConfig: visUiConfigSlice.reducer },
        preloadedState: { visUiConfig: visUiConfigInitialState },
    },
})

describe('useCellValueItems', () => {
    it('returns items from every stage of the program, labelled with their stage', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCellValueItems('p1'),
            buildMockOptions()
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
    })

    it('sorts data items alphabetically by name regardless of API order', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCellValueItems('p1'),
            buildMockOptions({
                [ANALYTICS_RESOURCE]: {
                    dimensions: [...analyticsResponse.dimensions].reverse(),
                },
            })
        )

        await waitFor(() => {
            expect(result.current.items).toBeDefined()
        })

        expect(result.current.items?.map((item) => item.name)).toEqual([
            'DE 1',
            'DE 2',
        ])
    })

    it('omits stageName when the program has only one stage', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCellValueItems('pSingle'),
            buildMockOptions({
                [ANALYTICS_RESOURCE]: {
                    dimensions: [
                        {
                            id: 'sX.de1',
                            name: 'DE 1',
                            aggregationType: 'SUM',
                            dimensionType: 'DATA_ELEMENT',
                        },
                    ],
                },
            })
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
        ])
    })

    it('labels program attributes with the tracked entity type name', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCellValueItems('p1'),
            buildMockOptions({
                [ANALYTICS_RESOURCE]: {
                    dimensions: [
                        {
                            id: 'attr1',
                            name: 'Age',
                            aggregationType: 'NONE',
                            dimensionType: 'PROGRAM_ATTRIBUTE',
                        },
                    ],
                },
            })
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
        ])
    })

    it('returns undefined items while loading', async () => {
        /* Hold the dimensions request in flight so the loading assertion is
         * deterministic. Without this, the query can resolve during the
         * wrapper's internal store wait, flipping isLoading to false before
         * the assertion under full-suite load. */
        const deferredDimensions = createDeferredQuery()
        const { result } = await renderHookWithAppWrapper(
            () => useCellValueItems('p1'),
            buildMockOptions({
                [ANALYTICS_RESOURCE]: deferredDimensions.defer(
                    () => analyticsResponse
                ),
            } as MockOptions['queryData'])
        )

        expect(result.current.isLoading).toBe(true)
        expect(result.current.items).toBeUndefined()

        await deferredDimensions.releaseAll()
        await waitFor(() => {
            expect(result.current.items).toBeDefined()
        })
    })
})
