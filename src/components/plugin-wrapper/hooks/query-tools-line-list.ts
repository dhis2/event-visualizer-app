import { getFullDimensionId } from '@modules/dimension'
import { getHeadersMap } from '@modules/visualization'
import type {
    Axis,
    CurrentVisualization,
    DimensionArray,
    DimensionRecord,
    OutputType,
} from '@types'
import { getRequestOptions } from './query-tools-common'

const convertToScreamingSnakeCase = (input: string) =>
    input.replaceAll(/[A-Z]/g, (c) => `_${c}`).toUpperCase()

const adaptDimensions = (
    dimensions: DimensionArray,
    outputType: OutputType
) => {
    const adaptedDimensions: DimensionArray = []

    dimensions.forEach((dimensionObj) => {
        const dimensionId = dimensionObj.dimension
        const dimension = convertToScreamingSnakeCase(dimensionId)

        // these are always passed without any prefix
        if (['completed', 'created', 'lastUpdated'].includes(dimensionId)) {
            adaptedDimensions.push({
                ...dimensionObj,
                dimension,
                program: undefined,
                programStage: undefined,
            })
            // eventDate, eventStatus and sheduledDate have a program or stage id prefixed
        } else if (
            ['eventDate', 'eventStatus', 'scheduledDate'].includes(dimensionId)
        ) {
            adaptedDimensions.push({
                ...dimensionObj,
                dimension,
                program: undefined,
            })
        } else if (
            dimensionId === 'programStatus' ||
            dimensionId === 'enrollmentDate' ||
            dimensionId === 'incidentDate'
        ) {
            if (outputType === 'TRACKED_ENTITY_INSTANCE') {
                // remove programStage for these dimensions for trackedEntity
                adaptedDimensions.push({
                    ...dimensionObj,
                    dimension,
                    programStage: undefined,
                })
            } else {
                // remove program/programStage for these dimensions for event/enrollment
                adaptedDimensions.push({
                    ...dimensionObj,
                    dimension,
                    program: undefined,
                    programStage: undefined,
                })
            }
        } else if (dimensionId === 'enrollmentOu') {
            adaptedDimensions.push({
                ...dimensionObj,
                dimension,
                program:
                    outputType === 'TRACKED_ENTITY_INSTANCE'
                        ? dimensionObj.program
                        : undefined,
                programStage: undefined,
            })
        } else {
            // everything else is a normal dimension id with programStage prefix
            adaptedDimensions.push({
                ...dimensionObj,
                program: undefined,
            })
        }
    })

    return adaptedDimensions
}

export const getAdaptedVisualization = (
    visualization: CurrentVisualization
): {
    adaptedVisualization: Record<Axis, object[]> & {
        outputType: OutputType
    }
    headers: (string | string[])[]
    parameters: object
} => {
    const outputType = visualization.outputType

    const parameters = getRequestOptions(visualization)

    const columns = visualization.columns ?? []
    const rows = visualization.rows ?? []
    const filters = visualization.filters ?? []

    const adaptedColumns = adaptDimensions(columns, outputType)
    const adaptedRows = adaptDimensions(rows, outputType)
    const adaptedFilters = adaptDimensions(filters, outputType)

    const baseHeadersMap = getHeadersMap(visualization)
    const dimensionHeadersMap: Record<string, string> = {
        ...baseHeadersMap,
        ...Object.fromEntries(
            Object.entries(baseHeadersMap).map(([key, value]) => [
                convertToScreamingSnakeCase(key),
                value,
            ])
        ),
    }

    const headers = [...adaptedColumns, ...adaptedRows].map(
        ({ dimension, program, programStage, repetition }) => {
            const programStageId = programStage?.id

            if (repetition?.indexes?.length) {
                return repetition.indexes.map((index) =>
                    getFullDimensionId({
                        programId: program?.id,
                        programStageId: `${programStageId}[${index}]`,
                        dimensionId:
                            dimensionHeadersMap[dimension] || dimension,
                        outputType,
                    })
                )
            } else {
                return getFullDimensionId({
                    programId: program?.id,
                    programStageId,
                    dimensionId: dimensionHeadersMap[dimension] || dimension,
                    outputType,
                })
            }
        }
    )

    const filterDimensionParameters = ({
        dimensionType,
        filter,
        items,
    }: DimensionRecord) =>
        dimensionType === 'ORGANISATION_UNIT_GROUP_SET' ||
        filter ||
        items?.length

    return {
        adaptedVisualization: {
            // only pass dimensions with conditions
            columns: adaptedColumns.filter(filterDimensionParameters),
            rows: adaptedRows.filter(filterDimensionParameters),
            filters: adaptedFilters.filter(filterDimensionParameters),
            outputType: outputType,
        },
        headers,
        parameters,
    }
}

const analyticsApiEndpointMap: Record<OutputType, string> = {
    ENROLLMENT: 'enrollments',
    EVENT: 'events',
    TRACKED_ENTITY_INSTANCE: 'trackedEntities',
}

export const getAnalyticsEndpoint = (outputType: OutputType): string =>
    analyticsApiEndpointMap[outputType]
