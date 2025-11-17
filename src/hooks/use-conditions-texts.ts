import { useMemo } from 'react'
import { isOptionSetMetadataItem } from '@components/app-wrapper/metadata-helpers/type-guards'
import { useMetadataItems } from '@components/app-wrapper/metadata-provider'
import type { LayoutDimension } from '@components/layout-panel/chip'
import { ouIdHelper } from '@dhis2/analytics'
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
} from '@modules/conditions'
import type { SavedVisualization } from '@types'

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

            if (isOptionSetMetadataItem(optionSetMetadata)) {
                const selectedOptionCodesLookup = new Set(selectedOptionCodes)
                return (
                    optionSetMetadata.options
                        .filter((option) =>
                            selectedOptionCodesLookup.has(option.code)
                        )
                        // Prefer name
                        .map((option) => option.name)
                )
            } else {
                // Fallback to ID
                return selectedOptionCodes
            }
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
