import type { ParameterRecord } from './query-tools-common'
import { getRequestOptions } from './query-tools-common'
import type { SupportedAxis } from '@constants/axis-types'
import type { SupportedInputType } from '@constants/input-types'
import { getFullDimensionId, isTimeDimensionId } from '@modules/dimension'
import { getHeadersMap } from '@modules/visualization'
import type { CurrentVisualization, DimensionArray } from '@types'

const adaptDimensions = (
    dimensions: DimensionArray,
    parameters: ParameterRecord,
    inputType: SupportedInputType
) => {
    const adaptedDimensions: DimensionArray = []

    dimensions.forEach((dimensionObj) => {
        const dimensionId = dimensionObj.dimension

        if (
            isTimeDimensionId(dimensionId) ||
            dimensionId === 'eventStatus' ||
            dimensionId === 'programStatus' ||
            dimensionId === 'created' ||
            (dimensionId === 'ou' && inputType === 'TRACKED_ENTITY_INSTANCE')
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
            !['created', 'createdBy', 'lastUpdatedBy'].includes(dimensionId)
        ) {
            adaptedDimensions.push(dimensionObj)
        }
    })

    return adaptedDimensions
}

export const getAdaptedVisualization = (
    visualization: CurrentVisualization
): {
    adaptedVisualization: Record<SupportedAxis, object[]> & {
        inputType: SupportedInputType
    }
    headers: (string | string[])[]
    parameters: object
} => {
    const inputType = visualization.outputType

    const parameters = getRequestOptions(visualization)

    const columns = visualization.columns ?? []
    const rows = visualization.rows ?? []
    const filters = visualization.filters ?? []

    const adaptedColumns = adaptDimensions(columns, parameters, inputType)
    const adaptedRows = adaptDimensions(rows, parameters, inputType)
    const adaptedFilters = adaptDimensions(filters, parameters, inputType)

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
                        inputType,
                    })
                )
            } else {
                return getFullDimensionId({
                    programId: program?.id,
                    programStageId,
                    dimensionId: dimensionHeadersMap[dimension] || dimension,
                    inputType,
                })
            }
        }
    )

    return {
        adaptedVisualization: {
            columns: adaptedColumns,
            rows: adaptedRows,
            filters: adaptedFilters,
            inputType,
        },
        headers,
        parameters,
    }
}

const analyticsApiEndpointMap: Record<SupportedInputType, string> = {
    ENROLLMENT: 'enrollments',
    EVENT: 'events',
    TRACKED_ENTITY_INSTANCE: 'trackedEntities',
}

export const getAnalyticsEndpoint = (inputType: SupportedInputType): string =>
    analyticsApiEndpointMap[inputType]
