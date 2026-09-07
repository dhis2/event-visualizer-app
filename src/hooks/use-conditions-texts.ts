import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { ouIdHelper } from '@dhis2/analytics'
import { useMetadataItems } from '@hooks'
import {
    parseConditionsStringToArray,
    shouldUseLegendSetConditions,
    shouldUseOptionSetConditions,
    shouldUseBooleanConditions,
    shouldUseOrgUnitConditions,
    getLegendSetConditionMetadataIds,
    getOptionSetIdAndSelectedOptionCodes,
    getBooleanConditionTexts,
    getOrgUnitConditionMetadataIds,
    getOperatorConditionTexts,
    getNoValueOptionName,
    NO_VALUE_OPTION_CODE,
} from '@modules/conditions'
import { isOptionSetMetadataItem } from '@modules/metadata/item-guards'
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
    const conditionsList = useMemo(
        () => parseConditionsStringToArray(conditions?.condition ?? ''),
        [conditions?.condition]
    )
    const metadataIds = useMemo(() => {
        if (shouldUseLegendSetConditions(conditions)) {
            return getLegendSetConditionMetadataIds(conditions, conditionsList)
        }
        if (shouldUseOrgUnitConditions(conditions, dimension, conditionsList)) {
            return getOrgUnitConditionMetadataIds(conditionsList, true)
        }
        if (
            shouldUseOptionSetConditions(conditions, dimension, conditionsList)
        ) {
            const { optionSetId } = getOptionSetIdAndSelectedOptionCodes(
                dimension,
                conditionsList
            )
            return [optionSetId]
        }

        return []
    }, [conditionsList, conditions, dimension])
    const metadataItems = useMetadataItems(metadataIds)
    const names = useMemo(() => {
        if (shouldUseLegendSetConditions(conditions)) {
            // Prefer name, fallback to ID
            return metadataIds.map((id) => metadataItems[id]?.name ?? id)
        }
        if (shouldUseOrgUnitConditions(conditions, dimension, conditionsList)) {
            // Prefer name from original ID, fallback to unprefixed ID name, then ID
            const idsWithoutUnprefixed = getOrgUnitConditionMetadataIds(
                conditionsList,
                false
            )
            return idsWithoutUnprefixed.map((id) => {
                const metadataItem = metadataItems[id]
                if (metadataItem?.name) {
                    return metadataItem.name
                }
                // Try unprefixed version if original has no name
                const unprefixedId = ouIdHelper.removePrefix(id)
                const unprefixedMetadataItem = metadataItems[unprefixedId]
                return unprefixedMetadataItem?.name ?? id
            })
        }
        if (
            shouldUseOptionSetConditions(conditions, dimension, conditionsList)
        ) {
            const { optionSetId, selectedOptionCodes } =
                getOptionSetIdAndSelectedOptionCodes(dimension, conditionsList)
            const optionSetMetadata = metadataItems[optionSetId]

            const optionNamesByCode = new Map(
                isOptionSetMetadataItem(optionSetMetadata)
                    ? optionSetMetadata.options.map((option) => [
                          option.code,
                          option.name,
                      ])
                    : []
            )
            optionNamesByCode.set(NO_VALUE_OPTION_CODE, getNoValueOptionName())

            return selectedOptionCodes.map(
                (code) => optionNamesByCode.get(code) ?? code
            )
        }
        if (shouldUseBooleanConditions(conditions, dimension, conditionsList)) {
            return getBooleanConditionTexts(conditionsList)
        }
        return getOperatorConditionTexts(
            dimension,
            conditionsList,
            formatValueOptions
        )
    }, [
        conditions,
        dimension,
        conditionsList,
        metadataIds,
        metadataItems,
        formatValueOptions,
    ])

    return names
}
