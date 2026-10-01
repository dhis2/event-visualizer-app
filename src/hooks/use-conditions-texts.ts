import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { useMetadataItems } from '@hooks'
import {
    getConditionsMetadataIds,
    getConditionsTexts,
    type Conditions,
    type FormatValueOptions,
} from '@modules/conditions'
import { useMemo } from 'react'

type UseConditionsTextsParams = {
    conditions: Conditions
    dimension: LayoutDimension
    formatValueOptions: FormatValueOptions
}

export const useConditionsTexts = ({
    conditions,
    dimension,
    formatValueOptions,
}: UseConditionsTextsParams): string[] => {
    const metadataIds = useMemo(
        () => getConditionsMetadataIds({ conditions, dimension }),
        [conditions, dimension]
    )
    const metadataItems = useMetadataItems(metadataIds)

    return useMemo(
        () =>
            getConditionsTexts({
                conditions,
                dimension,
                formatValueOptions,
                metadataItems,
            }),
        [conditions, dimension, formatValueOptions, metadataItems]
    )
}
