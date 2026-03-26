import { useContext } from 'react'
import { DimensionCardsContext } from './dimension-cards-context'

export const useIsDimensionSelected = (
    dimensionId: string | undefined
): boolean => {
    const { selectedIds } = useContext(DimensionCardsContext)
    return dimensionId !== undefined && selectedIds.has(dimensionId)
}
