import { ouIdHelper } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { useMetadataItems, useAppSelector } from '@hooks'
import {
    isStartEndDate,
    useLocalizedStartEndDateFormatter,
} from '@modules/dates'
import { extractPlainDimensionId } from '@modules/dimension'
import { getVisUiConfigItemsByDimension } from '@store/vis-ui-config-slice'
import { useMemo } from 'react'
import type { LayoutDimension } from './chip'

const getNameList = (
    idList: Array<string>,
    label: string,
    metadataItems: ReturnType<typeof useMetadataItems>
) =>
    idList.reduce((levelString, levelId, index) => {
        if (index > 0) {
            levelString += ', '
        }
        const levelName = metadataItems[levelId]?.name
        levelString += levelName ?? levelId

        return levelString
    }, `${label}: `)

export const useTooltipContentData = (dimension: LayoutDimension) => {
    const { programId, programStageId } = dimension
    const itemIds = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension.id)
    )
    const formatStartEndDate = useLocalizedStartEndDateFormatter()

    const metadataIds = useMemo(() => {
        const ids = new Set<string>()

        if (programId) {
            ids.add(programId)
        }
        if (programStageId) {
            ids.add(programStageId)
        }

        itemIds.forEach((id) => {
            if (
                ouIdHelper.hasLevelPrefix(id) ||
                ouIdHelper.hasGroupPrefix(id)
            ) {
                ids.add(ouIdHelper.removePrefix(id))
            } else {
                ids.add(extractPlainDimensionId(id))
            }
        })

        return Array.from(ids)
    }, [programId, programStageId, itemIds])

    const metadataItems = useMetadataItems(metadataIds)

    return useMemo(() => {
        const programName = (programId && metadataItems[programId]?.name) || ''
        const stageName =
            (programStageId && metadataItems[programStageId]?.name) || ''

        const levelIds: Array<string> = []
        const groupIds: Array<string> = []
        const itemDisplayNames: Array<string> = []

        itemIds.forEach((id) => {
            if (ouIdHelper.hasLevelPrefix(id)) {
                levelIds.push(ouIdHelper.removePrefix(id))
            } else if (ouIdHelper.hasGroupPrefix(id)) {
                groupIds.push(ouIdHelper.removePrefix(id))
            } else {
                const dimensionId = extractPlainDimensionId(id)
                itemDisplayNames.push(
                    isStartEndDate(dimensionId)
                        ? formatStartEndDate(dimensionId)
                        : (metadataItems[dimensionId]?.name ?? id)
                )
            }
        })

        if (levelIds.length > 0) {
            itemDisplayNames.push(
                getNameList(levelIds, i18n.t('Levels'), metadataItems)
            )
        }

        if (groupIds.length > 0) {
            itemDisplayNames.push(
                getNameList(groupIds, i18n.t('Groups'), metadataItems)
            )
        }

        return {
            programName,
            stageName,
            itemDisplayNames,
        }
    }, [programId, programStageId, itemIds, formatStartEndDate, metadataItems])
}
