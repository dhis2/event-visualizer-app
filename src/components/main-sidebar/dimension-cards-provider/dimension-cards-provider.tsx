import { useMemo, type FC, type ReactNode } from 'react'
import { DimensionCardsContext } from './dimension-cards-context'
import { useAppSelector, useMetadataItems } from '@hooks'
import { getVisUiConfigLayoutAllDimensionIds } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'

type DimensionCardsProviderProps = {
    children: ReactNode
}

export const DimensionCardsProvider: FC<DimensionCardsProviderProps> = ({
    children,
}) => {
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
        <DimensionCardsContext.Provider value={value}>
            {children}
        </DimensionCardsContext.Provider>
    )
}
