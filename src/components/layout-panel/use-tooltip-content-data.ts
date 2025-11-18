import i18n from '@dhis2/d2-i18n'
import { useCallback, useMemo } from 'react'
import type { LayoutDimension } from './chip'
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

export const useTooltipContentData = (dimension: LayoutDimension) => {
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

    return {
        programName,
        stageName,
        itemDisplayNames,
    }
}
