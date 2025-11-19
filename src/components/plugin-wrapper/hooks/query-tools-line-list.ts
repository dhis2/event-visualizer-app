import type { ParameterRecord } from './query-tools-common'
import { getRequestOptions } from './query-tools-common'
import { getFullDimensionId, isTimeDimensionId } from '@modules/dimension'
import { getHeadersMap } from '@modules/visualization'
import type {
    Axis,
    CurrentVisualization,
    DimensionArray,
    OutputType,
} from '@types'

const adaptDimensions = (
    dimensions: DimensionArray,
    parameters: ParameterRecord,
    outputType: OutputType
) => {
    const adaptedDimensions: DimensionArray = []

    dimensions.forEach((dimensionObj) => {
        const dimensionId = dimensionObj.dimension

        if (
            isTimeDimensionId(dimensionId) ||
            dimensionId === 'eventStatus' ||
            dimensionId === 'programStatus' ||
            dimensionId === 'created' ||
            (dimensionId === 'ou' && outputType === 'TRACKED_ENTITY_INSTANCE')
        ) {
            if (dimensionObj.items?.length) {
                const items = dimensionObj.items?.map((item) => item.id)
                if (
                    (dimensionId === 'programStatus' ||
                        isTimeDimensionId(dimensionId)) &&
                    Array.isArray(parameters[dimensionId])
                ) {
                    parameters[dimensionId].push(...items)
                } else if (dimensionId === 'ou') {
                    adaptedDimensions.push(dimensionObj)
                } else {
                    parameters[dimensionId] = items
                }
            }
        } else if (
            // "dy" dimension can be present in PT visualizations
            !['created', 'createdBy', 'lastUpdatedBy', 'dy'].includes(
                dimensionId
            )
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

    const adaptedColumns = adaptDimensions(columns, parameters, outputType)
    const adaptedRows = adaptDimensions(rows, parameters, outputType)
    const adaptedFilters = adaptDimensions(filters, parameters, outputType)

    const dimensionHeadersMap = getHeadersMap(visualization)

    const headers = [...columns, ...rows].map(
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
            columns: adaptedColumns,
            rows: adaptedRows,
            filters: adaptedFilters,
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
