import {
    visUiConfigSlice,
    initialState as visUiConfigInitialState,
    type VisUiConfigState,
    type CustomValueObject,
} from '@store/vis-ui-config-slice'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import { waitFor } from '@testing-library/react'
import type { RootState } from '@types'
import deepmerge from 'deepmerge'
import { describe, it, expect } from 'vitest'
import { useCustomValueDataElements } from '../use-custom-value-data-elements'

const ANALYTICS_RESOURCE = 'analytics/enrollments/aggregate/dimensions'

const metadata = {
    p1: {
        id: 'p1',
        name: 'Program 1',
        programType: 'WITH_REGISTRATION',
    },
    p2: {
        id: 'p2',
        name: 'Program 2',
        programType: 'WITH_REGISTRATION',
    },
    s1: {
        id: 's1',
        name: 'Stage 1',
        repeatable: false,
        hideDueDate: false,
        program: { id: 'p1' },
    },
    s2: {
        id: 's2',
        name: 'Stage 2',
        repeatable: false,
        hideDueDate: false,
        program: { id: 'p1' },
    },
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
describe('useCustomValueDataElements', () => {
    it('attaches stageName when the layout has no program stage', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueDataElements(),
            buildMockOptions({ columns: ['p1.enrollmentDate'] })
        )

        await waitFor(() => {
            expect(result.current.dataElements).toBeDefined()
        })

        expect(result.current.dataElements).toEqual([
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

    it('filters by stage and exposes the layout stage name when one stage is in the layout', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueDataElements(),
            buildMockOptions({ columns: ['s1.de1'] })
        )

        await waitFor(() => {
            expect(result.current.dataElements).toBeDefined()
        })

        expect(result.current.dataElements).toEqual([
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
            () => useCustomValueDataElements(),
            buildMockOptions(
                { columns: ['s1.de1'] },
                { id: 's2.de2', aggregationType: 'SUM' }
            )
        )

        await waitFor(() => {
            expect(result.current.dataElements).toBeDefined()
        })

        expect(result.current.customValueStageMismatch).toBe(true)
    })

    it('does not flag a mismatch when the custom value stage matches the layout stage', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueDataElements(),
            buildMockOptions(
                { columns: ['s1.de1'] },
                { id: 's1.de1', aggregationType: 'SUM' }
            )
        )

        await waitFor(() => {
            expect(result.current.dataElements).toBeDefined()
        })

        expect(result.current.customValueStageMismatch).toBe(false)
    })

    it('does not flag a mismatch when there is no layout stage', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueDataElements(),
            buildMockOptions(
                { columns: ['p1.enrollmentDate'] },
                { id: 's1.de1', aggregationType: 'SUM' }
            )
        )

        await waitFor(() => {
            expect(result.current.dataElements).toBeDefined()
        })

        expect(result.current.customValueStageMismatch).toBe(false)
    })

    it('returns undefined dataElements while loading', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCustomValueDataElements(),
            buildMockOptions({ columns: ['p1.enrollmentDate'] })
        )

        expect(result.current.isLoading).toBe(true)
        expect(result.current.dataElements).toBeUndefined()
    })
})
