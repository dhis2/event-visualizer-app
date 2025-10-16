import i18n from '@dhis2/d2-i18n'
import deepmerge from 'deepmerge'
import type {
    AnyMetadataItemInput,
    MetadataInput,
    OrganisationUnitMetadataItem,
} from './types'
import { DIMENSION_ID_ORGUNIT } from '@constants/dimensions'
import {
    formatDimensionId,
    getProgramDimensions,
    getTimeDimensionName,
    getTimeDimensions,
} from '@modules/dimension'
import type {
    DimensionId,
    DimensionType,
    InternalDimensionRecord,
    SavedVisualization,
} from '@types'

type ExtractedMetadatInput = Record<string, AnyMetadataItemInput>

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
const getDefaultOuMetadata = (type: SavedVisualization['outputType']) => ({
    [DIMENSION_ID_ORGUNIT]: {
        id: DIMENSION_ID_ORGUNIT,
        dimensionType: 'ORGANISATION_UNIT' as DimensionType,
        name: getDefaultOrgUnitLabel(type),
    },
})

const getDefaultOrgUnitLabel = (
    inputType: SavedVisualization['outputType']
) => {
    if (inputType === 'TRACKED_ENTITY_INSTANCE') {
        return i18n.t('Registration org. unit')
    } else {
        return i18n.t('Organisation unit')
    }
}

const getDynamicTimeDimensionsMetadata = (
    program?: SavedVisualization['program'],
    stage?: SavedVisualization['programStage'],
    outputType?: SavedVisualization['outputType']
): ExtractedMetadatInput =>
    Object.values(getTimeDimensions()).reduce((acc, dimension) => {
        const id = formatDimensionId({
            dimensionId: dimension.id,
            programId: program?.id,
            outputType,
        })

        acc[id] = {
            id,
            dimensionType: dimension.dimensionType,
            name: getTimeDimensionName(dimension, program, stage),
        }
        return acc
    }, {})

const extractTrackedEntityTypeMetadata = (
    visualization: SavedVisualization
): ExtractedMetadatInput => {
    const { id, name } = visualization.trackedEntityType ?? {}
    return { [id]: { id, name } }
}

const extractFixedDimensionsMetadata = (
    visualization: SavedVisualization
): ExtractedMetadatInput => {
    const fixedDimensionsMetadata = {}
    const dimensions = [
        ...visualization.columns,
        ...visualization.rows,
        ...visualization.filters,
    ]

    for (const dimension of dimensions.filter(
        (d) =>
            FIXED_DIMENSION_LOOKUP.has(d.dimension as DimensionId) &&
            d.program?.id
    )) {
        const dimensionId = formatDimensionId({
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
        fixedDimensionsMetadata[DIMENSION_ID_ORGUNIT] = getDefaultOuMetadata(
            visualization.outputType
        )[DIMENSION_ID_ORGUNIT]
    }

    return fixedDimensionsMetadata
}

const extractProgramDimensionsMetadata = (
    visualization: SavedVisualization
): ExtractedMetadatInput => {
    const programDimensionsMetadata = {}

    if (visualization.outputType === 'TRACKED_ENTITY_INSTANCE') {
        return programDimensionsMetadata
    }

    visualization.programDimensions.forEach((program) => {
        programDimensionsMetadata[program.id] = program

        const timeDimensions = getDynamicTimeDimensionsMetadata(program)
        Object.keys(timeDimensions).forEach((timeDimensionId) => {
            const formattedId = formatDimensionId({
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

const extractDimensionMetadata = (
    visualization: SavedVisualization
): ExtractedMetadatInput =>
    Object.entries(DIMENSION_METADATA_PROP_MAP).reduce(
        (metaData, [listName, dimensionName]) => {
            const dimensionList = visualization[listName] || []

            dimensionList.forEach((dimensionWrapper: object) => {
                const dimension: InternalDimensionRecord =
                    dimensionWrapper[dimensionName]
                metaData[dimension.id] = dimension
            })

            return metaData
        },
        {}
    )

const extractProgramMetadata = (
    visualization: SavedVisualization
): ExtractedMetadatInput => {
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

export const extractMetadataFromVisualization = (
    visualization: SavedVisualization
): MetadataInput => {
    /* Some of the collected metadata could contains duplicated IDs
     * (e.g. `programStage`) and these object may contain different fields.
     * So these objects should be merged rather than overwritten. */
    const sources: ExtractedMetadatInput[] = [
        extractTrackedEntityTypeMetadata(visualization),
        extractFixedDimensionsMetadata(visualization),
        extractProgramDimensionsMetadata(visualization),
        extractDimensionMetadata(visualization),
        extractProgramMetadata(visualization),
    ]
    const metadataInput: MetadataInput = sources.reduce(
        (acc, obj) => deepmerge(acc, obj),
        {}
    )

    addPathToOrganisationUnitMetadataItems(
        metadataInput,
        visualization.parentGraphMap
    )

    return metadataInput
}
