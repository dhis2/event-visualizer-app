import { ANALYTICS_OPTIONS } from '@constants/options'
import { getAnalyticsRequestDimensionName } from '@modules/analytics-request'
import { DROPPED_LEGACY_DIMENSIONS } from '@modules/dimension/ids'
import type {
    CurrentVisualization,
    DimensionArray,
    DimensionId,
    OutputType,
} from '@types'

export type ParameterRecord = Record<DimensionId, unknown>

export const adaptDimensions = (
    dimensions: DimensionArray,
    visualization: CurrentVisualization
): DimensionArray =>
    dimensions
        .filter((dim) => !DROPPED_LEGACY_DIMENSIONS.has(dim.dimension))
        .flatMap((dim) => {
            const repetitionIndexes =
                dim.programStage?.id && dim.repetition?.indexes.length
                    ? dim.repetition.indexes
                    : [undefined]

            return repetitionIndexes.map((repetitionIndex) => ({
                ...dim,
                dimension: getAnalyticsRequestDimensionName({
                    dimensionId: dim.dimension,
                    legendSetId: dim.legendSet?.id,
                    programId: dim.program?.id,
                    programStageId: dim.programStage?.id,
                    trackedEntityTypeId: visualization.trackedEntityType?.id,
                    outputType: visualization.outputType,
                    repetitionIndex,
                }),
                legendSet: undefined,
                program: undefined,
                programStage: undefined,
                repetition: undefined,
            }))
        })

const analyticsApiEndpointMap: Record<OutputType, string> = {
    ENROLLMENT: 'enrollments',
    EVENT: 'events',
    TRACKED_ENTITY_INSTANCE: 'trackedEntities',
}

export const getAnalyticsEndpoint = (outputType: OutputType): string =>
    analyticsApiEndpointMap[outputType]

// NOTE: visualization here already has the disabled options removed
export const getRequestOptions = (
    visualization: CurrentVisualization
): Record<string, unknown> =>
    Object.entries(ANALYTICS_OPTIONS).reduce<Record<string, unknown>>(
        (obj, [option, defaultValue]) => {
            const optionKey = option as keyof CurrentVisualization
            const value = visualization[optionKey]
            // only add parameter if value !== default
            if (value !== undefined && value !== defaultValue) {
                obj[option] = value
            }

            return obj
        },
        {}
    )
