import {
    RadioCard,
    RadioCardGroup,
} from '@components/dimension-modal/radio-card/radio-card'
import i18n from '@dhis2/d2-i18n'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    getVisUiConfigConditionsByDimension,
    setVisUiConfigGroupingByDimension,
} from '@store/vis-ui-config-slice'
import type { LegendSetMetadataItem } from '@types'
import { type FC, useCallback } from 'react'

const NO_GROUPING_VALUE = 'NO_GROUPING'
const MAX_PREVIEW_LEGENDS = 3

const getLegendsPreview = (
    legends: LegendSetMetadataItem['legends']
): string => {
    const preview = legends
        .slice(0, MAX_PREVIEW_LEGENDS)
        .map((legend) => legend.name)
        .join(', ')
    const remainingCount = legends.length - MAX_PREVIEW_LEGENDS

    /* `remainingCount` is deliberately not passed as `count`: that would make
     * i18next treat the key as plural, and the string extractor drops those. */
    return remainingCount > 0
        ? i18n.t('{{- legends}} and {{- remainingCount}} more', {
              legends: preview,
              remainingCount,
          })
        : preview
}

type GroupingRadioProps = {
    dimensionId: string
    legendSets: LegendSetMetadataItem[]
}

export const GroupingRadio: FC<GroupingRadioProps> = ({
    dimensionId,
    legendSets,
}) => {
    const dispatch = useAppDispatch()
    const { legendSet: selectedLegendSetId } = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimensionId)
    )

    const dataTest = `grouping-${dimensionId}`

    const selectLegendSet = useCallback(
        (legendSet?: string) => {
            if (legendSet === selectedLegendSetId) {
                return
            }
            dispatch(
                setVisUiConfigGroupingByDimension({ dimensionId, legendSet })
            )
        },
        [dispatch, dimensionId, selectedLegendSetId]
    )

    return (
        <RadioCardGroup legend={i18n.t('Grouping')} horizontal>
            {legendSets.map((legendSet) => (
                <RadioCard
                    key={legendSet.id}
                    selected={selectedLegendSetId === legendSet.id}
                    label={legendSet.name}
                    value={legendSet.id}
                    name={dataTest}
                    dataTest={`${dataTest}-${legendSet.id}`}
                    helpText={getLegendsPreview(legendSet.legends)}
                    onSelect={() => selectLegendSet(legendSet.id)}
                />
            ))}
            <RadioCard
                selected={!selectedLegendSetId}
                label={i18n.t('No grouping')}
                value={NO_GROUPING_VALUE}
                name={dataTest}
                dataTest={`${dataTest}-none`}
                helpText={i18n.t('Show each value individually')}
                onSelect={() => selectLegendSet(undefined)}
            />
        </RadioCardGroup>
    )
}
