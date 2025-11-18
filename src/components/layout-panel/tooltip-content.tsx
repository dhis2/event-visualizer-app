import i18n from '@dhis2/d2-i18n'
import { useCallback, useMemo, type FC } from 'react'
import type { LayoutDimension } from './chip'
import styles from './styles/tooltip.module.css'
import { isProgramMetadataItem } from '@components/app-wrapper/metadata-helpers/type-guards'
import { useMetadataStore } from '@components/app-wrapper/metadata-provider'
import { ouIdHelper } from '@dhis2/analytics'
import { useAppSelector } from '@hooks'
import {
    isStartEndDate,
    useLocalizedStartEndDateFormatter,
} from '@modules/dates'
import { getDimensionIdParts } from '@modules/dimension'
import {
    getVisUiConfigItemsByDimension,
    getVisUiConfigOutputType,
} from '@store/vis-ui-config-slice'

const MAX_LIST_LENGTH = 5

type TooltipContentProps = {
    dimension: LayoutDimension
    conditionsTexts: string[]
    axisId: string
}

type ItemsListProps = {
    itemDisplayNames: string[]
    dimensionId: string
}

const ItemsList: FC<ItemsListProps> = ({ itemDisplayNames, dimensionId }) => {
    if (itemDisplayNames.some((name) => !name)) {
        return null
    }
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
                {i18n.t('And {{count}} other...', {
                    count: numberOverRenderLimit,
                    defaultValue: 'And {{count}} other...',
                    defaultValue_plural: 'And {{count}} others...',
                })}
            </li>
        )
    }

    return <>{itemsToRender}</>
}

const NoItemsLabel: FC<{ dimensionId: string }> = ({ dimensionId }) => (
    <li key={`${dimensionId}-none-selected`} className={styles.item}>
        {i18n.t('None selected')}
    </li>
)

const StageName: FC<{ stageName: string }> = ({ stageName }) =>
    stageName ? (
        <li className={styles.item}>
            {i18n.t('Program stage: {{- stageName}}', {
                stageName,
                nsSeparator: '^^',
            })}
        </li>
    ) : null

const ProgramName: FC<{ programName: string }> = ({ programName }) =>
    programName ? (
        <li className={styles.item}>
            {i18n.t('Program: {{- programName}}', {
                programName,
                nsSeparator: '^^',
            })}
        </li>
    ) : null

const TooltipList: FC<{ children: React.ReactNode }> = ({ children }) => (
    <ul className={styles.list} data-test="tooltip-content">
        {children}
    </ul>
)

type ItemsSectionProps = {
    itemsList: string[]
    axisId: string
    dimensionId: string
}

const ItemsSection: FC<ItemsSectionProps> = ({
    itemsList,
    axisId,
    dimensionId,
}) => {
    if (itemsList.length) {
        return (
            <ItemsList itemDisplayNames={itemsList} dimensionId={dimensionId} />
        )
    } else if (axisId === 'filters') {
        return <NoItemsLabel dimensionId={dimensionId} />
    } else {
        return (
            <li key={`${dimensionId}-all-selected`} className={styles.item}>
                {i18n.t('Showing all values for this dimension')}
            </li>
        )
    }
}

export const TooltipContent: FC<TooltipContentProps> = ({
    dimension,
    conditionsTexts,
    axisId,
}) => {
    const { getMetadataItem } = useMetadataStore()
    const outputType = useAppSelector(getVisUiConfigOutputType)
    const itemIds = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension.id)
    )
    const formatStartEndDate = useLocalizedStartEndDateFormatter()
    const { programStageId, programId } = useMemo(
        () =>
            getDimensionIdParts({
                id: dimension.id,
                outputType,
            }),
        [dimension.id, outputType]
    )
    const { programName, stageName } = useMemo(() => {
        const programMetadata =
            typeof programId === 'string' ? getMetadataItem(programId) : null
        const programStageMetadata =
            typeof programStageId === 'string'
                ? getMetadataItem(programStageId)
                : null
        /* TODO: Decide if the code below can be removed. I would say YES
         * we need to make sure the stage is in the metadata instead looking
         * it up in the program metadata */
        const programStageFromProgram =
            programMetadata &&
            isProgramMetadataItem(programMetadata) &&
            typeof programStageId === 'string'
                ? programMetadata.programStages?.find(
                      (stage) => stage.id === programStageId
                  )
                : null
        const programStage = programStageMetadata ?? programStageFromProgram
        return {
            programName: programMetadata?.name ?? '',
            stageName: programStage?.name ?? '',
        }
    }, [programId, programStageId, getMetadataItem])

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
                const { dimensionId } = getDimensionIdParts({
                    id,
                    outputType,
                })
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
    }, [itemIds, getNameList, outputType, formatStartEndDate, getMetadataItem])

    switch (dimension.dimensionType) {
        case 'CATEGORY':
        case 'CATEGORY_OPTION_GROUP_SET':
        case 'ORGANISATION_UNIT_GROUP_SET':
        case 'STATUS':
            return (
                <TooltipList>
                    <ProgramName programName={programName} />
                    <ItemsSection
                        itemsList={itemDisplayNames}
                        axisId={axisId}
                        dimensionId={dimension.id}
                    />
                </TooltipList>
            )
        case 'PERIOD':
        case 'ORGANISATION_UNIT':
            return (
                <TooltipList>
                    <ProgramName programName={programName} />
                    {itemDisplayNames.length > 0 ? (
                        <ItemsList
                            itemDisplayNames={itemDisplayNames}
                            dimensionId={dimension.id}
                        />
                    ) : (
                        <NoItemsLabel dimensionId={dimension.id} />
                    )}
                </TooltipList>
            )
        case 'DATA_ELEMENT': {
            return (
                <TooltipList>
                    <ProgramName programName={programName} />
                    <StageName stageName={stageName} />
                    <ItemsSection
                        itemsList={conditionsTexts}
                        axisId={axisId}
                        dimensionId={dimension.id}
                    />
                </TooltipList>
            )
        }
        default: {
            return (
                <TooltipList>
                    <ProgramName programName={programName} />
                    <ItemsSection
                        itemsList={conditionsTexts}
                        axisId={axisId}
                        dimensionId={dimension.id}
                    />
                </TooltipList>
            )
        }
    }
}
