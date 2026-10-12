import { useMetadataItems } from '@hooks'
import { isProgramMetadataItem } from '@modules/metadata/item-guards'
import { useMemo } from 'react'
import type { LayoutDimension } from './chip'

export const useTooltipContentData = (dimension: LayoutDimension) => {
    const { programId, programStageId } = dimension

    const metadataIds = useMemo(
        () =>
            [programId, programStageId].filter((id): id is string =>
                Boolean(id)
            ),
        [programId, programStageId]
    )
    const metadataItems = useMetadataItems(metadataIds)

    return useMemo(() => {
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

        return {
            programName: programMetadata?.name ?? '',
            stageName: programStage?.name ?? '',
        }
    }, [programId, programStageId, metadataItems])
}
