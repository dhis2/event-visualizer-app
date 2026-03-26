import { createContext } from 'react'
import type { DimensionMetadataItem } from '@types'

export type DimensionCardsContextValue = {
    selectedIds: Set<string>
    selectedDimensions: DimensionMetadataItem[]
}

export const DimensionCardsContext = createContext<DimensionCardsContextValue>({
    selectedIds: new Set(),
    selectedDimensions: [],
})
