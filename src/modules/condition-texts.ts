import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { ouIdHelper } from '@dhis2/analytics'
import {
    getBooleanConditionTexts,
    getLegendSetConditionMetadataIds,
    getOperatorConditionTexts,
    getOptionSetIdAndSelectedOptionCodes,
    getOrgUnitConditionMetadataIds,
    parseConditionsStringToArray,
    shouldUseBooleanConditions,
    shouldUseLegendSetConditions,
    shouldUseOptionSetConditions,
    shouldUseOrgUnitConditions,
} from '@modules/conditions'
import { isOptionSetMetadataItem } from '@modules/metadata/item-guards'
import type { MetadataItem, SavedVisualization } from '@types'

export type Conditions = {
    condition?: string | string[]
    legendSet?: string
}

export type ConditionsFormatValueOptions = {
    locale?: string
    digitGroupSeparator?: SavedVisualization['digitGroupSeparator']
    baseUrl?: string
}

type ConditionsMetadataItems = Record<string, MetadataItem | undefined>

/* Split from getConditionsTexts so a React caller can feed the IDs to a
 * subscribing hook, while a plain caller reads them straight from the store. */
export const getConditionsMetadataIds = ({
    conditions,
    dimension,
}: {
    conditions: Conditions
    dimension: LayoutDimension
}): string[] => {
    const conditionsList = parseConditionsStringToArray(
        conditions?.condition ?? ''
    )

    if (shouldUseLegendSetConditions(conditions)) {
        return getLegendSetConditionMetadataIds(conditions, conditionsList)
    }
    if (shouldUseOrgUnitConditions(conditions, dimension, conditionsList)) {
        return getOrgUnitConditionMetadataIds(conditionsList, true)
    }
    if (shouldUseOptionSetConditions(conditions, dimension, conditionsList)) {
        return [
            getOptionSetIdAndSelectedOptionCodes(dimension, conditionsList)
                .optionSetId,
        ]
    }
    return []
}

export const getConditionsTexts = ({
    conditions,
    dimension,
    formatValueOptions,
    metadataItems,
}: {
    conditions: Conditions
    dimension: LayoutDimension
    formatValueOptions: ConditionsFormatValueOptions
    metadataItems: ConditionsMetadataItems
}): string[] => {
    const conditionsList = parseConditionsStringToArray(
        conditions?.condition ?? ''
    )

    if (shouldUseLegendSetConditions(conditions)) {
        return getLegendSetConditionMetadataIds(conditions, conditionsList).map(
            (id) => metadataItems[id]?.name ?? id
        )
    }

    if (shouldUseOrgUnitConditions(conditions, dimension, conditionsList)) {
        /* Passed `false` so the prefixed ID is returned: the prefixed entry is
         * preferred for naming, with the unprefixed one as the fallback. */
        return getOrgUnitConditionMetadataIds(conditionsList, false).map(
            (id) =>
                metadataItems[id]?.name ??
                metadataItems[ouIdHelper.removePrefix(id)]?.name ??
                id
        )
    }

    if (shouldUseOptionSetConditions(conditions, dimension, conditionsList)) {
        const { optionSetId, selectedOptionCodes } =
            getOptionSetIdAndSelectedOptionCodes(dimension, conditionsList)
        const optionSetMetadata = metadataItems[optionSetId]

        if (!isOptionSetMetadataItem(optionSetMetadata)) {
            return selectedOptionCodes
        }
        const selectedOptionCodesLookup = new Set(selectedOptionCodes)
        return optionSetMetadata.options
            .filter((option) => selectedOptionCodesLookup.has(option.code))
            .map((option) => option.name)
    }

    if (shouldUseBooleanConditions(conditions, dimension, conditionsList)) {
        return getBooleanConditionTexts(conditionsList)
    }

    return getOperatorConditionTexts(
        dimension,
        conditionsList,
        formatValueOptions
    )
}
