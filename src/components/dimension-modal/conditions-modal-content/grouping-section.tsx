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
import type { DimensionMetadataItem, LegendSetMetadataItem } from '@types'
import { type FC, useCallback } from 'react'
import { FilteringSection } from './filtering-section'

const NO_GROUPING_VALUE = 'NO_GROUPING'
const MAX_PREVIEW_LEGENDS = 3
const RANGE_NAME = /^\s*(-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)\s*$/

const formatLegendName = (name: string): string => {
    const range = name.match(RANGE_NAME)

    return range ? `${range[1]}–${range[2]}` : name
}

const getLegendsPreview = (
    legends: LegendSetMetadataItem['legends']
): string => {
    const preview = legends
        .slice(0, MAX_PREVIEW_LEGENDS)
        .map((legend) => formatLegendName(legend.name))
        .join(', ')
    const remainingCount = legends.length - MAX_PREVIEW_LEGENDS

    return remainingCount > 0
        ? i18n.t('{{- legends}} and {{- remainingCount}} more', {
              legends: preview,
              remainingCount,
          })
        : preview
}

type GroupingSectionProps = {
    dimension: DimensionMetadataItem
    legendSets: LegendSetMetadataItem[]
}

export const GroupingSection: FC<GroupingSectionProps> = ({
    dimension,
    legendSets,
}) => {
    const dispatch = useAppDispatch()
    const dimensionId = dimension.id
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
        <RadioCardGroup legend={i18n.t('Grouping')} hideLegend>
            {legendSets.map((legendSet) => (
                <RadioCard
                    key={legendSet.id}
                    selected={selectedLegendSetId === legendSet.id}
                    label={i18n.t('{{- name}} grouping', {
                        name: legendSet.name,
                    })}
                    value={legendSet.id}
                    name={dataTest}
                    emphasized
                    flushReveal
                    dataTest={`${dataTest}-${legendSet.id}`}
                    helpText={getLegendsPreview(legendSet.legends)}
                    onSelect={() => selectLegendSet(legendSet.id)}
                >
                    <FilteringSection dimension={dimension} nested />
                </RadioCard>
            ))}
            <RadioCard
                selected={!selectedLegendSetId}
                label={i18n.t('No grouping')}
                value={NO_GROUPING_VALUE}
                name={dataTest}
                emphasized
                flushReveal
                dataTest={`${dataTest}-none`}
                helpText={i18n.t('Show each value individually')}
                onSelect={() => selectLegendSet(undefined)}
            >
                <FilteringSection dimension={dimension} nested />
            </RadioCard>
        </RadioCardGroup>
    )
}
