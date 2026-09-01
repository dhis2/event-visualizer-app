import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import { addVisUiConfigLayoutDimension } from '@store/vis-ui-config-slice'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import { act } from '@testing-library/react'
import type { CurrentVisualization, RootState } from '@types'
import { describe, it, expect } from 'vitest'
import { useHasUnappliedChanges } from '../use-has-unapplied-changes'

const STAGE_ID = 'stage1'
const DIMENSION_ID = `${STAGE_ID}.de1`

const metadata = {
    [STAGE_ID]: { id: STAGE_ID, name: 'Stage 1' },
    [DIMENSION_ID]: {
        id: DIMENSION_ID,
        name: 'Data element 1',
        dimensionId: 'de1',
        programStageId: STAGE_ID,
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    },
}

/* digitGroupSeparator is seeded onto the default store's visUiConfig from the
 * mocked system settings (src/test-utils/__fixtures__/system-settings.json),
 * so a currentVis that matches the default ui config must carry the same
 * value. */
const populatedVis = {
    type: 'LINE_LIST',
    outputType: 'EVENT',
    digitGroupSeparator: 'SPACE',
    columns: [],
    rows: [],
    filters: [],
} as unknown as CurrentVisualization

const renderHookWithVis = (currentVis: Partial<RootState>['currentVis']) =>
    renderHookWithAppWrapper(useHasUnappliedChanges, {
        metadata,
        partialStore: { preloadedState: { currentVis } },
    })

describe('useHasUnappliedChanges', () => {
    it('is false for an empty visualization', async () => {
        const { result } = await renderHookWithVis({})

        expect(result.current).toBe(false)
    })

    it('is false for a visualization whose ui config matches it', async () => {
        const { result } = await renderHookWithVis(populatedVis)

        expect(result.current).toBe(false)
    })

    it('becomes true when a dimension is added to the layout', async () => {
        const { result, store } = await renderHookWithVis(populatedVis)

        expect(result.current).toBe(false)

        await act(async () => {
            store.dispatch(
                addVisUiConfigLayoutDimension({
                    axis: 'columns',
                    dimensionId: DIMENSION_ID,
                })
            )
        })

        expect(result.current).toBe(true)
    })

    it('becomes false again once the change is applied', async () => {
        const { result, store } = await renderHookWithVis(populatedVis)

        await act(async () => {
            store.dispatch(
                addVisUiConfigLayoutDimension({
                    axis: 'columns',
                    dimensionId: DIMENSION_ID,
                })
            )
        })

        expect(result.current).toBe(true)

        await act(async () => {
            store.dispatch(tUpdateCurrentVisFromVisUiConfig())
        })

        expect(result.current).toBe(false)
    })
})
