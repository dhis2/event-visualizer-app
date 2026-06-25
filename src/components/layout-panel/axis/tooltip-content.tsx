import i18n from '@dhis2/d2-i18n'
import { useMetadataItem } from '@hooks'
import type { ConditionsObject } from '@store/vis-ui-config-slice'
import type { DimensionType } from '@types'
import { type FC } from 'react'
import type { LayoutDimension } from './chip'
import styles from './styles/tooltip.module.css'
import { useTooltipContentData } from './use-tooltip-content-data'

const MAX_LIST_LENGTH = 5

const ITEM_BASED_DIMENSION_TYPES: ReadonlySet<DimensionType> = new Set([
    'CATEGORY',
    'CATEGORY_OPTION_GROUP_SET',
    'ORGANISATION_UNIT_GROUP_SET',
    'STATUS',
    'PERIOD',
    'ORGANISATION_UNIT',
])

const NO_FALLBACK_DIMENSION_TYPES: ReadonlySet<DimensionType> = new Set([
    'PERIOD',
    'ORGANISATION_UNIT',
])

type TooltipContentProps = {
    dimension: LayoutDimension
    conditions: ConditionsObject
    conditionsTexts: string[]
    axisId: string
}

type ItemsListProps = {
    itemDisplayNames: string[]
    dimensionId: string
}

const ItemsList: FC<ItemsListProps> = ({ itemDisplayNames, dimensionId }) => {
    const itemsToRender = itemDisplayNames
        .slice(0, MAX_LIST_LENGTH)
        .map((name) => (
            <li key={`${dimensionId}-${name}`} className={styles.item}>
                {name}
            </li>
        ))

    const numberOverRenderLimit = itemDisplayNames.length - MAX_LIST_LENGTH
    if (numberOverRenderLimit > 0) {
        itemsToRender.push(
            <li key={`${dimensionId}-render-limit`} className={styles.item}>
                {i18n.t('And {{- count}} other...', {
                    count: numberOverRenderLimit,
                    defaultValue: 'And {{- count}} other...',
                    defaultValue_plural: 'And {{- count}} others...',
                })}
            </li>
        )
    }

    return <>{itemsToRender}</>
}

export const TooltipContent: FC<TooltipContentProps> = ({
    dimension,
    conditions,
    conditionsTexts,
    axisId,
}) => {
    const { programName, stageName, itemDisplayNames } =
        useTooltipContentData(dimension)

    const isGroupedIntoRanges = Boolean(conditions.legendSet)
    const legendSetName =
        useMetadataItem(conditions.legendSet)?.name ?? conditions.legendSet

    const dimensionType = dimension.dimensionType
    const isItemBased =
        !!dimensionType && ITEM_BASED_DIMENSION_TYPES.has(dimensionType)
    /* In group mode with no band filter, conditionsTexts holds the legend-set
     * name — already shown on the "Ranges:" line below — so don't list it
     * again; only show band names when a band filter is set. */
    const itemsList = isItemBased
        ? itemDisplayNames
        : isGroupedIntoRanges && !conditions.condition
          ? []
          : conditionsTexts
    const showStage = dimensionType === 'DATA_ELEMENT'
    const emptyShowsNoneSelected =
        axisId === 'filters' ||
        (!!dimensionType && NO_FALLBACK_DIMENSION_TYPES.has(dimensionType))
    const emptyStateMessage = emptyShowsNoneSelected
        ? i18n.t('None selected')
        : i18n.t('Showing all values for this dimension')

    return (
        <ul className={styles.list} data-test="tooltip-content">
            {programName && (
                <li className={styles.item}>
                    {i18n.t('Program: {{- programName}}', {
                        programName,
                        nsSeparator: '^^',
                    })}
                </li>
            )}
            {showStage && stageName && (
                <li className={styles.item}>
                    {i18n.t('Program stage: {{- stageName}}', {
                        stageName,
                        nsSeparator: '^^',
                    })}
                </li>
            )}
            {isGroupedIntoRanges && legendSetName && (
                <li className={styles.item}>
                    {i18n.t('Groups: {{- legendSetName}}', {
                        legendSetName,
                        nsSeparator: '^^',
                    })}
                </li>
            )}
            {itemsList.length > 0 ? (
                <ItemsList
                    itemDisplayNames={itemsList}
                    dimensionId={dimension.id}
                />
            ) : isGroupedIntoRanges ? null : (
                <li className={styles.item}>{emptyStateMessage}</li>
            )}
        </ul>
    )
}
