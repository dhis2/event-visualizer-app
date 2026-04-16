import {
    combineAllDimensionsFromVisualization,
    getEnrollmentFixedDimensions,
    getFullDimensionId,
    getMainDimensions,
    getStageFixedDimensions,
    getTimeDimensionName,
    getTimeDimensions,
    getTrackedEntityTypeFixedDimensions,
    getUiDimensionType,
} from '@modules/dimension'
import type {
    MetadataInput,
    MetadataInputItem,
    MetadataInputMap,
    OrganisationUnitMetadataItem,
    DimensionMetadataItem,
    Program,
    ProgramStage,
    SavedVisualization,
} from '@types'
import deepmerge from 'deepmerge'

const DIMENSION_METADATA_PROP_MAP = {
    dataElementDimensions: 'dataElement',
    attributeDimensions: 'attribute',
    programIndicatorDimensions: 'programIndicator',
    categoryDimensions: 'category',
    categoryOptionGroupSetDimensions: 'categoryOptionGroupSet',
    organisationUnitGroupSetDimensions: 'organisationUnitGroupSet',
    dataElementGroupSetDimensions: 'dataElementGroupSet',
}
const getDefaultDynamicTimeDimensionsMetadata = (
    program?: Program,
    stage?: ProgramStage,
    outputType?: SavedVisualization['outputType']
): MetadataInputMap =>
    Object.values(getTimeDimensions()).reduce((acc, dimension) => {
        const id = getFullDimensionId({
            dimensionId: dimension.id,
            programId: program?.id,
            outputType: outputType,
        })

        acc[id] = {
            id,
            dimensionType: dimension.dimensionType,
            name: getTimeDimensionName(dimension, program, stage),
        }
        return acc
    }, {})

export const extractTrackedEntityTypeMetadata = (
    visualization: SavedVisualization
): MetadataInputMap =>
    visualization.trackedEntityType
        ? {
              [visualization.trackedEntityType.id]: {
                  id: visualization.trackedEntityType.id,
                  name: visualization.trackedEntityType.name,
              },
          }
        : {}

export const extractProgramDimensionsMetadata = (
    visualization: SavedVisualization
): MetadataInputMap => {
    const programDimensionsMetadata = {}

    if (visualization.outputType === 'TRACKED_ENTITY_INSTANCE') {
        return programDimensionsMetadata
    }

    visualization.programDimensions.forEach((program) => {
        programDimensionsMetadata[program.id] = program

        if (program.programStages) {
            program.programStages.forEach((stage) => {
                programDimensionsMetadata[stage.id!] = stage
            })
        }
    })

    return programDimensionsMetadata
}

export const extractDimensionMetadata = (
    visualization: SavedVisualization
): MetadataInputMap => {
    const dimensionMetadata = Object.entries(
        DIMENSION_METADATA_PROP_MAP
    ).reduce((metaData, [listName, dimensionName]) => {
        const dimensionList = visualization[listName] || []

        dimensionList.forEach((dimensionWrapper: object) => {
            const dimension: DimensionMetadataItem =
                dimensionWrapper[dimensionName]
            metaData[dimension.id] = dimension
        })

        return metaData
    }, {})
    return dimensionMetadata
}

export const extractValueMetadata = (
    visualization: SavedVisualization
): MetadataInputMap =>
    visualization.value
        ? {
              [visualization.value.id]: visualization.value,
          }
        : {}

const addPathToOrganisationUnitMetadataItems = (
    metadataInput: MetadataInput,
    parentGraphMap?: SavedVisualization['parentGraphMap']
) => {
    if (parentGraphMap) {
        for (const [key, path] of Object.entries(parentGraphMap)) {
            const organisationUnitMetadaInputItem = metadataInput[
                key
            ] as OrganisationUnitMetadataItem

            if (organisationUnitMetadaInputItem) {
                organisationUnitMetadaInputItem.path = `/${path}/${key}`
            }
        }
    }
}

export const supplementDimensionMetadata = (
    metadataInput: MetadataInputMap,
    visualization: SavedVisualization
) => {
    const { outputType } = visualization
    const dimensions = combineAllDimensionsFromVisualization(visualization)

    const additionalDimensionMetadata = dimensions.reduce(
        (metadata, dimension) => {
            const collectedItem = metadataInput[dimension.dimension]

            // Skip for items without a name
            if (typeof collectedItem?.name !== 'string') {
                return metadata
            }

            const prefixedId = getFullDimensionId({
                dimensionId: dimension.dimension,
                programStageId: dimension.programStage?.id,
                programId: dimension.program?.id,
                outputType,
            })

            const item: MetadataInputItem = Object.entries(
                collectedItem
            ).reduce(
                (acc, [key, value]) => {
                    if (
                        key !== 'uid' &&
                        key !== 'id' &&
                        key !== 'name' &&
                        key !== 'dimensionType'
                    ) {
                        acc[key] = value
                    }
                    return acc
                },
                {
                    id: prefixedId,
                    name: collectedItem.name,
                    dimensionType: getUiDimensionType(
                        prefixedId,
                        dimension.dimensionType!
                    ),
                }
            )

            if (dimension.optionSet?.id) {
                item.optionSetId = dimension.optionSet?.id
            }

            if (dimension.legendSet?.id) {
                item.legendSetId = dimension.legendSet.id
            }

            if (dimension.valueType) {
                item.valueType = dimension.valueType
            }

            if (dimension.program?.id) {
                item.programId = dimension.program.id
            }

            if (dimension.programStage?.id) {
                item.programStageId = dimension.programStage.id
            }

            metadata[prefixedId] = item

            return metadata
        },
        {}
    )

    return deepmerge(metadataInput, additionalDimensionMetadata)
}

const getFixedDimensionOverrides = (
    visualization: SavedVisualization
): MetadataInputMap => {
    const overrides: MetadataInputMap = {}

    for (const program of visualization.programDimensions ?? []) {
        if (program.programType === 'WITH_REGISTRATION') {
            for (const dim of getEnrollmentFixedDimensions(program)) {
                overrides[dim.id] = dim
            }
        }

        for (const stage of program.programStages ?? []) {
            for (const dim of getStageFixedDimensions(program, stage)) {
                overrides[dim.id] = dim
            }
        }
    }

    if (visualization.trackedEntityType) {
        for (const dim of getTrackedEntityTypeFixedDimensions(
            visualization.trackedEntityType
        )) {
            overrides[dim.id] = dim
        }
    }

    return overrides
}

export const extractMetadataFromVisualization = (
    visualization: SavedVisualization
): MetadataInputMap => {
    const program = visualization.programDimensions?.[0]
    const stage = program?.programStages?.[0]

    /* Some of the collected metadata could contains duplicated IDs
     * (e.g. `programStage`) and these object may contain different fields.
     * So these objects should be merged rather than overwritten. */
    const sources: MetadataInputMap[] = [
        visualization.metaData,
        getDefaultDynamicTimeDimensionsMetadata(
            program,
            stage,
            visualization.outputType
        ),
        getMainDimensions(visualization.outputType),
        extractTrackedEntityTypeMetadata(visualization),
        extractProgramDimensionsMetadata(visualization),
        extractDimensionMetadata(visualization),
        extractValueMetadata(visualization),
    ]
    const baseMetadataInput: MetadataInputMap = sources.reduce(
        (acc, obj) => deepmerge(acc, obj),
        {}
    )

    const supplementedMetadataInput = supplementDimensionMetadata(
        baseMetadataInput,
        visualization
    )

    // Overlay fixed dimensions with canonical names from shared helpers.
    // Applied after supplement so the shared helpers' names win.
    const withFixedNames = deepmerge(
        supplementedMetadataInput,
        getFixedDimensionOverrides(visualization)
    )

    addPathToOrganisationUnitMetadataItems(
        withFixedNames,
        visualization.parentGraphMap
    )

    // Remove plain-keyed entries that now have a compound counterpart.
    // The compound entries carry all the fields (code, dimensionType, etc.),
    // so the plain duplicates are no longer needed.
    const dimensions = combineAllDimensionsFromVisualization(visualization)
    for (const dimension of dimensions) {
        const compoundId = getFullDimensionId({
            dimensionId: dimension.dimension,
            programStageId: dimension.programStage?.id,
            programId: dimension.program?.id,
            outputType: visualization.outputType,
        })
        if (compoundId !== dimension.dimension && withFixedNames[compoundId]) {
            delete withFixedNames[dimension.dimension]
        }
    }

    return withFixedNames
}
