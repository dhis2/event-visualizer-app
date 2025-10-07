import i18n from '@dhis2/d2-i18n'
import { useCallback, useMemo, type FC } from 'react'
import type { LayoutDimension } from './chip'
import styles from './styles/tooltip.module.css'
import { isProgramMetadataItem } from '@components/app-wrapper/metadata-helpers/type-guards'
import {
    useMetadataItem,
    useMetadataStore,
} from '@components/app-wrapper/metadata-provider'
import { ouIdHelper } from '@dhis2/analytics'
import { useAppSelector } from '@hooks'
import {
    isStartEndDate,
    useLocalizedStartEndDateFormatter,
} from '@modules/dates'
import { getDimensionIdParts } from '@modules/dimension'
import {
    getVisUiConfigItemsByDimension,
    getVisUiConfigInputType,
} from '@store/vis-ui-config-slice'

const MAX_LIST_LENGTH = 5

type TooltipContentProps = {
    dimension: LayoutDimension
    conditionsTexts: string[]
    axisId: string
}

export const TooltipContent: FC<TooltipContentProps> = ({
    dimension,
    conditionsTexts,
    axisId,
}) => {
    const { getMetadataItem } = useMetadataStore()
    const inputType = useAppSelector(getVisUiConfigInputType)
    const itemIds = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension.id)
    )
    const formatStartEndDate = useLocalizedStartEndDateFormatter()
    const { programStageId, programId } = useMemo(
        () =>
            getDimensionIdParts({
                id: dimension.id,
                inputType,
            }),
        [dimension.id, inputType]
    )
    const programMetadata = useMetadataItem(programId ?? '')
    const { programName, stageName } = useMemo(
        () =>
            !programMetadata || !isProgramMetadataItem(programMetadata)
                ? { programName: '', stageName: '' }
                : {
                      programName: programMetadata.name,
                      stageName:
                          programMetadata.programStages?.find(
                              (stage) => stage.id === programStageId
                          )?.name ?? '',
                  },
        [programMetadata, programStageId]
    )

    const getNameList = useCallback(
        (idList: Array<string>, label: string) =>
            idList.reduce((levelString, levelId, index) => {
                if (index > 0) {
                    levelString += ', '
                }
                const levelName = getMetadataItem(levelId)?.name
                levelString += levelName ?? levelId

                return levelString
            }, `${label}: `),
        [getMetadataItem]
    )
    const itemDisplayNames = useMemo<Array<string>>(() => {
        const levelIds: Array<string> = []
        const groupIds: Array<string> = []
        const itemDisplayNames: Array<string> = []

        itemIds.forEach((id) => {
            if (ouIdHelper.hasLevelPrefix(id)) {
                levelIds.push(ouIdHelper.removePrefix(id))
            } else if (ouIdHelper.hasGroupPrefix(id)) {
                groupIds.push(ouIdHelper.removePrefix(id))
            } else {
                const { dimensionId } = getDimensionIdParts({ id, inputType })
                itemDisplayNames.push(
                    isStartEndDate(dimensionId)
                        ? formatStartEndDate(dimensionId)
                        : getMetadataItem(dimensionId)?.name ?? id
                )
            }
        })

        if (levelIds.length > 0) {
            itemDisplayNames.push(getNameList(levelIds, i18n.t('Levels')))
        }

        if (groupIds.length > 0) {
            itemDisplayNames.push(getNameList(groupIds, i18n.t('Groups')))
        }

        return itemDisplayNames
    }, [itemIds, getNameList, inputType, formatStartEndDate, getMetadataItem])

    const renderItems = (itemDisplayNames: Array<string>) => {
        if (itemDisplayNames.some((name) => !name)) {
            return null
        }
        const itemsToRender = itemDisplayNames
            .slice(0, MAX_LIST_LENGTH)
            .map((name) => (
                <li key={`${dimension.id}-${name}`} className={styles.item}>
                    {name}
                </li>
            ))

        const numberOverRenderLimit = itemDisplayNames.length - MAX_LIST_LENGTH
        if (numberOverRenderLimit > 0) {
            itemsToRender.push(
                <li
                    key={`${dimension.id}-render-limit`}
                    className={styles.item}
                >
                    {i18n.t('And {{count}} other...', {
                        count: numberOverRenderLimit,
                        defaultValue: 'And {{count}} other...',
                        defaultValue_plural: 'And {{count}} others...',
                    })}
                </li>
            )
        }

        return itemsToRender
    }

    const renderNoItemsLabel = () => (
        <li key={`${dimension.id}-none-selected`} className={styles.item}>
            {i18n.t('None selected')}
        </li>
    )

    const renderStageName = () =>
        stageName && (
            <li className={styles.item}>
                {i18n.t('Program stage: {{- stageName}}', {
                    stageName,
                    nsSeparator: '^^',
                })}
            </li>
        )

    const renderProgramName = () =>
        programName && (
            <li className={styles.item}>
                {i18n.t('Program: {{- programName}}', {
                    programName,
                    nsSeparator: '^^',
                })}
            </li>
        )

    const renderItemsSection = (itemsList) => {
        if (itemsList.length) {
            return renderItems(itemsList)
        } else if (axisId === 'filters') {
            return renderNoItemsLabel()
        } else {
            return (
                <li
                    key={`${dimension.id}-all-selected`}
                    className={styles.item}
                >
                    {i18n.t('Showing all values for this dimension')}
                </li>
            )
        }
    }

    switch (dimension.dimensionType) {
        case 'CATEGORY':
        case 'CATEGORY_OPTION_GROUP_SET':
        case 'ORGANISATION_UNIT_GROUP_SET':
        case 'STATUS':
            return (
                <ul className={styles.list} data-test="tooltip-content">
                    {renderProgramName()}
                    {renderItemsSection(itemDisplayNames)}
                </ul>
            )
        case 'PERIOD':
        case 'ORGANISATION_UNIT':
            return (
                <ul className={styles.list} data-test="tooltip-content">
                    {renderProgramName()}
                    {itemDisplayNames
                        ? renderItems(itemDisplayNames)
                        : renderNoItemsLabel()}
                </ul>
            )
        case 'DATA_ELEMENT': {
            return (
                <ul className={styles.list} data-test="tooltip-content">
                    {renderProgramName()}
                    {renderStageName()}
                    {renderItemsSection(conditionsTexts)}
                </ul>
            )
        }
        default: {
            return (
                <ul className={styles.list} data-test="tooltip-content">
                    {renderProgramName()}
                    {renderItemsSection(conditionsTexts)}
                </ul>
            )
        }
    }
}
