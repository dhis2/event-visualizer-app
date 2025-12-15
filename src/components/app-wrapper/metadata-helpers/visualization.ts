import i18n from '@dhis2/d2-i18n'
import deepmerge from 'deepmerge'
import { DIMENSION_ID_ORGUNIT } from '@constants/dimensions'
import {
    combineAllDimensionsFromVisualization,
    getFullDimensionId,
    getMainDimensions,
    getProgramDimensions,
    getTimeDimensionName,
    getTimeDimensions,
    getUiDimensionType,
} from '@modules/dimension'
import { transformVisualization } from '@modules/visualization'
import type {
    MetadataInput,
    MetadataInputItem,
    MetadataInputMap,
    OrganisationUnitMetadataItem,
    DimensionId,
    DimensionType,
    InternalDimensionRecord,
    SavedVisualization,
} from '@types'

const FIXED_DIMENSION_LOOKUP = new Set<DimensionId>([
    'ou',
    'eventStatus',
    'programStatus',
])
const DIMENSION_METADATA_PROP_MAP = {
    dataElementDimensions: 'dataElement',
    attributeDimensions: 'attribute',
    programIndicatorDimensions: 'programIndicator',
    categoryDimensions: 'category',
    categoryOptionGroupSetDimensions: 'categoryOptionGroupSet',
    organisationUnitGroupSetDimensions: 'organisationUnitGroupSet',
    dataElementGroupSetDimensions: 'dataElementGroupSet',
}
const getDefaultOrgUnitMetadata = (
    outputType: SavedVisualization['outputType']
) => ({
    ou: {
        id: 'ou',
        dimensionType: 'ORGANISATION_UNIT' as DimensionType,
        name: getDefaultOrgUnitLabel(outputType),
    },
})

const getDefaultOrgUnitLabel = (
    outputType: SavedVisualization['outputType']
) => {
    if (outputType === 'TRACKED_ENTITY_INSTANCE') {
        return i18n.t('Registration org. unit')
    } else {
        return i18n.t('Organisation unit')
    }
}

const getDefaultDynamicTimeDimensionsMetadata = (
    program?: SavedVisualization['program'],
    stage?: SavedVisualization['programStage'],
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

export const extractFixedDimensionsMetadata = (
    visualization: SavedVisualization
): MetadataInputMap => {
    const fixedDimensionsMetadata = {}
    const dimensions = combineAllDimensionsFromVisualization(visualization)

    for (const dimension of dimensions.filter(
        (d) =>
            FIXED_DIMENSION_LOOKUP.has(d.dimension as DimensionId) &&
            d.program?.id
    )) {
        const dimensionId = getFullDimensionId({
            dimensionId: dimension.dimension as DimensionId,
            programId: dimension.program?.id,
            outputType: visualization.outputType,
        })
        if (dimension.program?.id) {
            const metadata = getProgramDimensions(dimension.program?.id)[
                dimensionId
            ]

            if (metadata) {
                fixedDimensionsMetadata[dimensionId] = metadata
            }
        }
    }
    if (
        visualization.outputType === 'TRACKED_ENTITY_INSTANCE' &&
        dimensions.some((d) => (d.dimension as DimensionId) === 'ou')
    ) {
        fixedDimensionsMetadata[DIMENSION_ID_ORGUNIT] =
            getDefaultOrgUnitMetadata(visualization.outputType)[
                DIMENSION_ID_ORGUNIT
            ]
    }
    return fixedDimensionsMetadata
}

export const extractProgramDimensionsMetadata = (
    visualization: SavedVisualization
): MetadataInputMap => {
    const programDimensionsMetadata = {}

    if (visualization.outputType === 'TRACKED_ENTITY_INSTANCE') {
        return programDimensionsMetadata
    }

    visualization.programDimensions.forEach((program) => {
        programDimensionsMetadata[program.id] = program
        const timeDimensions = getDefaultDynamicTimeDimensionsMetadata(program)
        Object.keys(timeDimensions).forEach((timeDimensionId) => {
            const formattedId = getFullDimensionId({
                dimensionId: timeDimensionId as DimensionId,
                programId: program.id,
                outputType: visualization.outputType,
            })
            programDimensionsMetadata[formattedId] = {
                ...timeDimensions[timeDimensionId],
                id: formattedId,
            }
        })

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
            const dimension: InternalDimensionRecord =
                dimensionWrapper[dimensionName]
            metaData[dimension.id] = dimension
        })

        return metaData
    }, {})
    return dimensionMetadata
}

export const extractProgramMetadata = (
    visualization: SavedVisualization
): MetadataInputMap => {
    const programAndStagesMetadata = {}
    if (visualization.program) {
        programAndStagesMetadata[visualization.program.id] =
            visualization.program
    }
    if (visualization.programStage) {
        programAndStagesMetadata[visualization.programStage.id] =
            visualization.programStage
    }
    return programAndStagesMetadata
}

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
                organisationUnitMetadaInputItem.path = path
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

            const item: MetadataInputItem = {
                id: prefixedId,
                name: collectedItem.name,
                dimensionType: getUiDimensionType(
                    prefixedId,
                    dimension.dimensionType!
                ),
            }

            if (dimension.optionSet?.id) {
                item.optionSet = dimension.optionSet?.id
            }

            if (dimension.valueType) {
                item.valueType = dimension.valueType
            }

            if (dimension.program?.id) {
                item.program = dimension.program.id
            }

            if (dimension.programStage?.id) {
                item.programStage = dimension.programStage.id
            }

            metadata[prefixedId] = item

            return metadata
        },
        {}
    )

    return deepmerge(metadataInput, additionalDimensionMetadata)
}

export const extractMetadataFromVisualization = (
    visualization: SavedVisualization
): MetadataInputMap => {
    const transformedVisualization = transformVisualization(
        visualization
    ) as SavedVisualization
    /* Some of the collected metadata could contains duplicated IDs
     * (e.g. `programStage`) and these object may contain different fields.
     * So these objects should be merged rather than overwritten. */
    const sources: MetadataInputMap[] = [
        getDefaultOrgUnitMetadata(visualization.outputType),
        getDefaultDynamicTimeDimensionsMetadata(
            visualization.program,
            visualization.programStage,
            visualization.outputType
        ),
        getMainDimensions(visualization.outputType),
        getProgramDimensions(visualization.program.id),
        extractTrackedEntityTypeMetadata(transformedVisualization),
        extractFixedDimensionsMetadata(transformedVisualization),
        extractProgramDimensionsMetadata(transformedVisualization),
        extractDimensionMetadata(transformedVisualization),
        extractProgramMetadata(transformedVisualization),
    ]
    const baseMetadataInput: MetadataInputMap = sources.reduce(
        (acc, obj) => deepmerge(acc, obj),
        {}
    )

    const supplementedMetadataInput = supplementDimensionMetadata(
        baseMetadataInput,
        transformedVisualization
    )

    addPathToOrganisationUnitMetadataItems(
        supplementedMetadataInput,
        transformedVisualization.parentGraphMap
    )
    return supplementedMetadataInput
}
