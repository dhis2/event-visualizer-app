import { useContext } from 'react'
import { SelectedDimensionsContext } from './selected-dimensions-context'

export const useIsDimensionSelected = (
    dimensionId: string | undefined
): boolean => {
    const { selectedIds } = useContext(SelectedDimensionsContext)
    return dimensionId !== undefined && selectedIds.has(dimensionId)
}
