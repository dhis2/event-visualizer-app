import { useAppDispatch } from '@hooks'
import { setVisUiConfigCellValue } from '@store/vis-ui-config-slice'
import { renderHook } from '@testing-library/react'
import type { DimensionMetadataItem } from '@types'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSetCellValue } from '../use-set-cell-value'

vi.mock('@hooks', () => ({
    useAppDispatch: vi.fn(),
}))

describe('useSetCellValue', () => {
    const mockDispatch = vi.fn()

    beforeEach(() => {
        vi.mocked(useAppDispatch).mockReturnValue(mockDispatch)
    })

    const buildDimension = (aggregationType: string) =>
        ({
            id: 's1.de1',
            dimensionId: 'de1',
            valueType: 'NUMBER',
            aggregationType,
        }) as unknown as DimensionMetadataItem

    it("sets DEFAULT, so the value follows the item's own type", () => {
        const { result } = renderHook(() => useSetCellValue())

        result.current(buildDimension('SUM'))

        expect(mockDispatch).toHaveBeenCalledWith(
            setVisUiConfigCellValue({
                id: 's1.de1',
                aggregationType: 'DEFAULT',
            })
        )
    })

    it('sets AVERAGE for an item that aggregates by NONE', () => {
        const { result } = renderHook(() => useSetCellValue())

        result.current(buildDimension('NONE'))

        expect(mockDispatch).toHaveBeenCalledWith(
            setVisUiConfigCellValue({
                id: 's1.de1',
                aggregationType: 'AVERAGE',
            })
        )
    })
})
