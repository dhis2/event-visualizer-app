import { useMemo, type FC, type ReactNode } from 'react'
import { SelectedDimensionsContext } from './selected-dimensions-context'
import { useAppSelector, useMetadataItems } from '@hooks'
import { getVisUiConfigLayoutAllDimensionIds } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'

type SelectedDimensionsProviderProps = {
    children: ReactNode
}

export const SelectedDimensionsProvider: FC<
    SelectedDimensionsProviderProps
> = ({ children }) => {
    const selectedDimensionIds = useAppSelector(
        getVisUiConfigLayoutAllDimensionIds
    )
    const selectedDimensionsRecord = useMetadataItems(selectedDimensionIds)

    const selectedIds = useMemo(
        () => new Set(selectedDimensionIds),
        [selectedDimensionIds]
    )

    const selectedDimensions = useMemo(
        () =>
            Object.values(selectedDimensionsRecord) as DimensionMetadataItem[],
        [selectedDimensionsRecord]
    )

    const value = useMemo(
        () => ({ selectedIds, selectedDimensions }),
        [selectedIds, selectedDimensions]
    )

    return (
        <SelectedDimensionsContext.Provider value={value}>
            {children}
        </SelectedDimensionsContext.Provider>
    )
}
