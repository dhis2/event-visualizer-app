import { useMetadataItems, useAppSelector } from '@hooks'
import {
    getItemDisplayNames,
    getItemMetadataIds,
} from '@modules/dimension/item-names'
import { isProgramMetadataItem } from '@modules/metadata/item-guards'
import { useLocalizedStartEndDateFormatter } from '@modules/utils/dates'
import { getVisUiConfigItemsByDimension } from '@store/vis-ui-config-slice'
import { useMemo } from 'react'
import type { LayoutDimension } from './chip'

export const useTooltipContentData = (dimension: LayoutDimension) => {
    const itemIds = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension.id)
    )
    const formatStartEndDate = useLocalizedStartEndDateFormatter()
    const { programId, programStageId } = dimension

    // Collect all metadata IDs that will be needed
    const metadataIds = useMemo(() => {
        const ids = new Set<string>(getItemMetadataIds(itemIds))

        if (programId) {
            ids.add(programId)
        }
        if (programStageId) {
            ids.add(programStageId)
        }

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

        const itemDisplayNames = getItemDisplayNames({
            itemIds,
            metadataItems,
            formatStartEndDate,
        })

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
