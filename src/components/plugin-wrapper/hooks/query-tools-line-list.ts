import { getFullDimensionId } from '@modules/dimension'
import { getHeadersMap } from '@modules/visualization'
import type {
    Axis,
    CurrentVisualization,
    DimensionArray,
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

    // This function should accommodate the various dimension cases and exceptions detailed in the Analytics apis spreadsheet

    dimensions.forEach((dimensionObj) => {
        const dimensionId = dimensionObj.dimension

        console.log('adapt dim', dimensionId)

        // these are always passed without any prefix
        if (['completed', 'created', 'lastUpdated'].includes(dimensionId)) {
            adaptedDimensions.push({
                ...dimensionObj,
                dimension: convertToScreamingSnakeCase(dimensionId),
                program: undefined,
                programStage: undefined,
            })
            // eventDate, eventStatus and sheduledDate have a program or stage id prefixed
        } else if (
            ['eventDate', 'eventStatus', 'scheduledDate'].includes(dimensionId)
        ) {
            adaptedDimensions.push({
                ...dimensionObj,
                dimension: convertToScreamingSnakeCase(dimensionId),
            })
        } else if (
            dimensionId === 'programStatus' ||
            dimensionId === 'enrollmentDate' ||
            dimensionId === 'incidentDate'
        ) {
            const dimension = convertToScreamingSnakeCase(dimensionId)

            if (outputType === 'TRACKED_ENTITY_INSTANCE') {
                adaptedDimensions.push({
                    ...dimensionObj,
                    dimension,
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
            // enrollmentOu must be passed as ou for ENROLLMENT
            // program prefix must be removed for EVENT/ENROLLMENT
            adaptedDimensions.push({
                ...dimensionObj,
                dimension: outputType === 'ENROLLMENT' ? 'ou' : 'ENROLLMENT_OU',
                program:
                    outputType === 'TRACKED_ENTITY_INSTANCE'
                        ? dimensionObj.program
                        : undefined,
                programStage: undefined,
            })
        } else if (
            // "dy" dimension can be present in PT visualizations
            // everything else is a normal dimension id with program/programStage prefix
            !['dy'].includes(dimensionId)
        ) {
            adaptedDimensions.push(dimensionObj)
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

    return {
        adaptedVisualization: {
            // only pass dimensions with conditions
            columns: adaptedColumns.filter(({ items }) => items?.length),
            rows: adaptedRows.filter(({ items }) => items?.length),
            filters: adaptedFilters.filter(({ items }) => items?.length),
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
