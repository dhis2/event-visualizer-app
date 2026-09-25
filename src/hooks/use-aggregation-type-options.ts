import { aggregationTypeApi } from '@api/aggregation-type-api'
import {
    AGGREGATION_TYPES,
    aggregationTypeDisplayNames,
} from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import type { AggregationType, DimensionType } from '@types'
import { useMemo } from 'react'

type AggregationTypeOption = {
    value: AggregationType
    label: string
    disabled: boolean
}

type UseAggregationTypeOptionsResult = {
    options: AggregationTypeOption[]
    isItemDefaultNone: boolean
}

/* The aggregation choices for the cell value. "Use item default" names the
 * item's own aggregation, and is unavailable when that is NONE. */
export const useAggregationTypeOptions = ({
    dimensionId,
    dimensionType,
}: {
    dimensionId: string
    dimensionType: DimensionType
}): UseAggregationTypeOptionsResult => {
    const { data: itemAggregationType } =
        aggregationTypeApi.useGetItemAggregationTypeQuery({
            dimensionId,
            dimensionType,
        })

    return useMemo(() => {
        const isItemDefaultNone = itemAggregationType === 'NONE'
        const itemDefaultLabel =
            itemAggregationType && !isItemDefaultNone
                ? i18n.t('Use item default ({{- aggregationType}})', {
                      aggregationType:
                          aggregationTypeDisplayNames[itemAggregationType],
                  })
                : aggregationTypeDisplayNames.DEFAULT

        return {
            isItemDefaultNone,
            options: AGGREGATION_TYPES.map((value) => ({
                value,
                label:
                    value === 'DEFAULT'
                        ? itemDefaultLabel
                        : aggregationTypeDisplayNames[value],
                disabled: value === 'DEFAULT' && isItemDefaultNone,
            })),
        }
    }, [itemAggregationType])
}
