import i18n from '@dhis2/d2-i18n'
import { useDimensionValueTexts } from '@hooks'
import type { Conditions } from '@modules/conditions'
import type { DimensionType, SavedVisualization } from '@types'
import { type FC } from 'react'
import type { LayoutDimension } from './chip'
import styles from './styles/tooltip.module.css'
import { useTooltipContentData } from './use-tooltip-content-data'

const MAX_LIST_LENGTH = 5

const NO_FALLBACK_DIMENSION_TYPES: ReadonlySet<DimensionType> = new Set([
    'PERIOD',
    'ORGANISATION_UNIT',
])

type TooltipContentProps = {
    dimension: LayoutDimension
    itemIds: string[]
    conditions: Conditions
    digitGroupSeparator: SavedVisualization['digitGroupSeparator']
    groupingName?: string
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
    itemIds,
    conditions,
    digitGroupSeparator,
    groupingName,
    axisId,
}) => {
    const { programName, stageName } = useTooltipContentData(dimension)
    const itemsList = useDimensionValueTexts({
        dimension,
        itemIds,
        conditions,
        formatValueOptions: { digitGroupSeparator },
    })

    const dimensionType = dimension.dimensionType
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
            {groupingName && (
                <li className={styles.item}>
                    {i18n.t('Grouping: {{- groupingName}}', {
                        groupingName,
                        nsSeparator: '^^',
                    })}
                </li>
            )}
            {itemsList.length > 0 ? (
                <ItemsList
                    itemDisplayNames={itemsList}
                    dimensionId={dimension.id}
                />
            ) : (
                <li className={styles.item}>{emptyStateMessage}</li>
            )}
        </ul>
    )
}
