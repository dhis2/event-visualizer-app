import { ANALYTICS_OPTIONS } from '@constants/options'
import type { CurrentVisualization, DimensionId, OutputType } from '@types'

export type ParameterRecord = Record<DimensionId, unknown>

const analyticsApiEndpointMap: Record<OutputType, string> = {
    ENROLLMENT: 'enrollments',
    EVENT: 'events',
    TRACKED_ENTITY_INSTANCE: 'trackedEntities',
}

export const getAnalyticsEndpoint = (outputType: OutputType): string =>
    analyticsApiEndpointMap[outputType]

export const computeLayoutKey = (visualization: CurrentVisualization): string =>
    `${visualization.outputType}|${[
        ...visualization.columns,
        ...visualization.rows,
        ...visualization.filters,
    ]
        .map((d) => d.dimension)
        .join('|')}`

// NOTE: visualization here already has the disabled options removed
export const getRequestOptions = (visualization: CurrentVisualization) => {
    const options = Object.entries(ANALYTICS_OPTIONS).reduce(
        (obj, [option, defaultValue]) => {
            // only add parameter if value !== default
            if (
                visualization[option] !== undefined &&
                visualization[option] !== defaultValue
            ) {
                obj[option] = visualization[option]
            }

            return obj
        },
        {} as ParameterRecord
    )

    return options
}
