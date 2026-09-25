import i18n from '@dhis2/d2-i18n'
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import {
    useAggregationTypeOptions,
    useAppDispatch,
    useAppSelector,
} from '@hooks'
import {
    getVisUiConfigCustomValue,
    setVisUiConfigCustomValueAggregationType,
} from '@store/vis-ui-config-slice'
import type { AggregationType, DimensionMetadataItem } from '@types'
import { type FC, useCallback } from 'react'

type AggregationSectionProps = {
    dimension: DimensionMetadataItem
}

export const AggregationSection: FC<AggregationSectionProps> = ({
    dimension,
}) => {
    const dispatch = useAppDispatch()
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const { options, isItemDefaultNone } = useAggregationTypeOptions({
        dimensionId: dimension.id,
        dimensionType: dimension.dimensionType,
    })

    const onChange = useCallback(
        ({ selected }: { selected: string }) =>
            dispatch(
                setVisUiConfigCustomValueAggregationType(
                    selected as AggregationType
                )
            ),
        [dispatch]
    )

    return (
        <SingleSelectField
            label={i18n.t('Aggregation')}
            helpText={
                isItemDefaultNone
                    ? i18n.t(
                          'This item has no default aggregation, so one must be chosen.'
                      )
                    : undefined
            }
            onChange={onChange}
            selected={customValue?.aggregationType}
            dense
            dataTest="aggregation-section-select"
        >
            {options.map(({ value, label, disabled }) => (
                <SingleSelectOption
                    key={value}
                    value={value}
                    label={label}
                    disabled={disabled}
                />
            ))}
        </SingleSelectField>
    )
}
