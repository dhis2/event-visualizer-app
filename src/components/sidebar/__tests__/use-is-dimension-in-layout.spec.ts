import { useIsDimensionInLayout } from '@components/sidebar/use-is-dimension-in-layout'
import {
    initialState,
    visUiConfigSlice,
    type CustomValueObject,
} from '@store/vis-ui-config-slice'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import { describe, it, expect } from 'vitest'

const renderForDimension = (
    dimensionId: string,
    customValue?: CustomValueObject
) =>
    renderHookWithAppWrapper(() => useIsDimensionInLayout(dimensionId), {
        partialStore: {
            reducer: { visUiConfig: visUiConfigSlice.reducer },
            preloadedState: {
                visUiConfig: {
                    ...initialState,
                    layout: { columns: ['stage1.ou'], rows: [], filters: [] },
                    customValue,
                },
            },
        },
    })

describe('useIsDimensionInLayout', () => {
    it('is true for a dimension on an axis', async () => {
        const { result } = await renderForDimension('stage1.ou')

        expect(result.current).toBe(true)
    })

    it('is true for the cell value', async () => {
        const { result } = await renderForDimension('stage1.weight', {
            id: 'stage1.weight',
            aggregationType: 'SUM',
        })

        expect(result.current).toBe(true)
    })

    it('is false for a dimension used nowhere', async () => {
        const { result } = await renderForDimension('stage1.weight')

        expect(result.current).toBe(false)
    })
})
