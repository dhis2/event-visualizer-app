import {
    combineAllDimensionsFromVisualization,
    getCompoundDimensionId,
    getEnrollmentFixedDimensions,
    getFullDimensionId,
    getMainDimensions,
    getStageFixedDimensions,
    getTimeDimensionName,
    getTimeDimensions,
    getTrackedEntityTypeFixedDimensions,
    getUiDimensionType,
    toAppLocalDimensions,
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

            const prefixedId = getCompoundDimensionId(dimension, outputType)

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
    // Translate API dimension IDs to app-local IDs (e.g. ou → enrollmentOu
    // for enrollment-scoped org units) before any downstream processing.
    const vis: SavedVisualization = {
        ...visualization,
        columns: toAppLocalDimensions(visualization.columns ?? []),
        rows: toAppLocalDimensions(visualization.rows ?? []),
        filters: toAppLocalDimensions(visualization.filters ?? []),
    }

    // Only use the single-program shortcut when there's exactly one program.
    // Multi-program visualizations (e.g. TEI with multiple programs) need
    // different handling — deferred for now.
    const singleProgram =
        vis.programDimensions?.length === 1
            ? vis.programDimensions[0]
            : undefined
    const singleStage = singleProgram?.programStages?.[0]

    const sources: MetadataInputMap[] = [
        vis.metaData,
        getDefaultDynamicTimeDimensionsMetadata(
            singleProgram,
            singleStage,
            vis.outputType
        ),
        getMainDimensions(vis.outputType),
        extractTrackedEntityTypeMetadata(vis),
        extractProgramDimensionsMetadata(vis),
        extractDimensionMetadata(vis),
        extractValueMetadata(vis),
    ]
    const baseMetadataInput: MetadataInputMap = sources.reduce(
        (acc, obj) => deepmerge(acc, obj),
        {}
    )

    const supplementedMetadataInput = supplementDimensionMetadata(
        baseMetadataInput,
        vis
    )

    // Overlay fixed dimensions with canonical names from shared helpers.
    // Applied after supplement so the shared helpers' names win.
    const withFixedNames = deepmerge(
        supplementedMetadataInput,
        getFixedDimensionOverrides(vis)
    )

    addPathToOrganisationUnitMetadataItems(withFixedNames, vis.parentGraphMap)

    // Remove plain-keyed entries that now have a compound counterpart.
    // The compound entries carry all the fields (code, dimensionType, etc.),
    // so the plain duplicates are no longer needed.
    const dimensions = combineAllDimensionsFromVisualization(vis)
    for (const dimension of dimensions) {
        const compoundId = getCompoundDimensionId(dimension, vis.outputType)
        if (compoundId !== dimension.dimension && withFixedNames[compoundId]) {
            delete withFixedNames[dimension.dimension]
        }
    }

    return withFixedNames
}
