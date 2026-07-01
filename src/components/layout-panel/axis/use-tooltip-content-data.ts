import { ouIdHelper } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { useMetadataItems, useAppSelector } from '@hooks'
import { extractPlainDimensionId } from '@modules/dimension/ids'
import { isProgramMetadataItem } from '@modules/metadata/item-guards'
import {
    isStartEndDate,
    useLocalizedStartEndDateFormatter,
} from '@modules/utils/dates'
import { getVisUiConfigItemsByDimension } from '@store/vis-ui-config-slice'
import { useMemo } from 'react'
import type { LayoutDimension } from './chip'

// Helper function to format a list of metadata IDs into a labeled string
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
    const itemIds = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension.id)
    )
    const formatStartEndDate = useLocalizedStartEndDateFormatter()
    const { programId, programStageId } = dimension

    // Collect all metadata IDs that will be needed
    const metadataIds = useMemo(() => {
        const ids = new Set<string>()

        if (programId) {
            ids.add(programId)
        }
        if (programStageId) {
            ids.add(programStageId)
        }

        // Add IDs from itemIds processing
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

    // Get reactive metadata
    const metadataItems = useMetadataItems(metadataIds)

    // Compute the final data using reactive metadata
    const { programName, stageName, itemDisplayNames } = useMemo(() => {
        // Program and stage names
        const programMetadata = programId ? metadataItems[programId] : null
        const programStageMetadata = programStageId
            ? metadataItems[programStageId]
            : null
        /* TODO: Decide if the code below can be removed. I would say YES
         * we need to make sure the stage is in the metadata instead looking
         * it up in the program metadata */
        const programStageFromProgram =
            programMetadata &&
            isProgramMetadataItem(programMetadata) &&
            programStageId
                ? programMetadata.programStages?.find(
                      (stage) => stage.id === programStageId
                  )
                : null
        const programStage = programStageMetadata ?? programStageFromProgram
        const programName = programMetadata?.name ?? ''
        const stageName = programStage?.name ?? ''

        // Item display names
        const levelIds: Array<string> = []
        const groupIds: Array<string> = []
        const itemDisplayNames: Array<string> = []

        itemIds.forEach((id) => {
            if (ouIdHelper.hasLevelPrefix(id)) {
                levelIds.push(ouIdHelper.removePrefix(id))
            } else if (ouIdHelper.hasGroupPrefix(id)) {
                groupIds.push(ouIdHelper.removePrefix(id))
            } else {
                const plainId = extractPlainDimensionId(id)
                itemDisplayNames.push(
                    isStartEndDate(plainId)
                        ? formatStartEndDate(plainId)
                        : (metadataItems[plainId]?.name ?? id)
                )
            }
        })

        // Add level and group names
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

    return {
        programName,
        stageName,
        itemDisplayNames,
    }
}
