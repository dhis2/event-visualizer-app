import type { MetadataStoreItem } from '@components/app-wrapper/metadata-helpers/types'
import type { LayoutDimension } from '@components/visualization-layout/chip'
import {
    DIMENSION_TYPE_DATA_ELEMENT,
    DIMENSION_TYPE_PERIOD,
    DIMENSION_TYPE_ORGANISATION_UNIT,
    DIMENSION_TYPE_STATUS,
} from '@constants/dimension-types'
import type { InputType } from '@constants/input-types'
import {
    INPUT_TYPE_ENROLLMENT,
    INPUT_TYPE_TRACKED_ENTITY,
} from '@constants/input-types'

const extractDimensionIdParts = (id: string, inputType: InputType) => {
    let rawStageId
    const [dimensionId, part2, part3] = (id || '').split('.').reverse()
    let programId = part3
    if (part3 || inputType !== INPUT_TYPE_TRACKED_ENTITY) {
        rawStageId = part2
    }
    if (inputType === INPUT_TYPE_TRACKED_ENTITY && !part3) {
        programId = part2
    }
    const [programStageId, repetitionIndex] = (rawStageId || '').split('[')
    return {
        dimensionId,
        programStageId,
        ...(programId ? { programId } : {}),
        repetitionIndex:
            repetitionIndex?.length &&
            repetitionIndex.substring(0, repetitionIndex.indexOf(']')),
    }
}

interface GetLayoutDimensionsParams {
    dimensionIds: string[]
    inputType: InputType
    getMetadataItem: (id: string) => MetadataStoreItem | undefined
}

export const getLayoutDimensions = ({
    dimensionIds,
    inputType,
    getMetadataItem,
}: GetLayoutDimensionsParams): LayoutDimension[] => {
    const dimensions: LayoutDimension[] = dimensionIds.map((id) => {
        const { dimensionId, programStageId, programId } =
            extractDimensionIdParts(id, inputType)

        const metadataItem = getMetadataItem(id)
        
        // Ensure we always have the required LayoutDimension properties
        const dimension: LayoutDimension = {
            id: metadataItem?.id || id,
            name: metadataItem?.name || id,
            dimensionId,
            dimensionType: metadataItem?.dimensionType,
            // Spread any additional properties from metadata
            ...metadataItem,
            // Override with our computed values
            dimensionId,
            programStageId,
            programId,
        }

        return dimension
    })

    if (
        ![INPUT_TYPE_ENROLLMENT, INPUT_TYPE_TRACKED_ENTITY].includes(inputType)
    ) {
        return dimensions
    }

    return dimensions.map((dimension) => {
        if (
            [DIMENSION_TYPE_DATA_ELEMENT, DIMENSION_TYPE_PERIOD].includes(
                dimension.dimensionType || dimension.dimensionItemType
            )
        ) {
            const duplicates = dimensions.filter(
                (d) =>
                    d.dimensionId === dimension.dimensionId &&
                    d !== dimension &&
                    ((dimension.programId && d.programId) ||
                        (dimension.programStageId && d.programStageId))
            )

            if (duplicates.length > 0) {
                const sameProgramId = duplicates.find(
                    (dup) => dup.programId === dimension.programId
                )
                const thirdPartyDuplicates = duplicates
                    .filter((dup) => dup.programId !== dimension.programId)
                    .find((dpid) =>
                        duplicates.find(
                            (dup) =>
                                dup.programStageId !== dpid.programStageId &&
                                dup.programId === dpid.programId
                        )
                    )

                if (sameProgramId || thirdPartyDuplicates) {
                    dimension.suffix = getMetadataItem(
                        dimension.programStageId
                    )?.name
                } else if (dimension.programId) {
                    dimension.suffix = getMetadataItem(
                        dimension.programId
                    )?.name
                }
            }
        } else if (
            // always suffix ou and statuses for TE
            inputType === INPUT_TYPE_TRACKED_ENTITY &&
            [DIMENSION_TYPE_ORGANISATION_UNIT, DIMENSION_TYPE_STATUS].includes(
                dimension.dimensionType || dimension.dimensionItemType
            ) &&
            dimension.programId
        ) {
            dimension.suffix = getMetadataItem(dimension.programId)?.name
        }

        return dimension
    })
}
