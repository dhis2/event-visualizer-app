import { createContext } from 'react'
import type { DimensionMetadataItem } from '@types'

export type SelectedDimensionsContextValue = {
    selectedIds: Set<string>
    selectedDimensions: DimensionMetadataItem[]
}

export const SelectedDimensionsContext =
    createContext<SelectedDimensionsContextValue>({
        selectedIds: new Set(),
        selectedDimensions: [],
    })
