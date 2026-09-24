import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { useMetadataItems } from '@hooks'
import {
    getConditionsMetadataIds,
    getConditionsTexts,
} from '@modules/condition-texts'
import type { SavedVisualization } from '@types'
import { useMemo } from 'react'

type Conditions = {
    condition?: string | string[]
    legendSet?: string
}

type FormatValueOptions = {
    locale?: string
    digitGroupSeparator?: SavedVisualization['digitGroupSeparator']
    baseUrl?: string
}

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
