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

// NOTE: visualization here already has the disabled options removed
export const getRequestOptions = (visualization: CurrentVisualization) => {
    const visualizationOptions = visualization as Record<string, unknown>

    const options = Object.entries(ANALYTICS_OPTIONS).reduce<
        Record<string, unknown>
    >((obj, [option, defaultValue]) => {
        // only add parameter if value !== default
        if (
            visualizationOptions[option] !== undefined &&
            visualizationOptions[option] !== defaultValue
        ) {
            obj[option] = visualizationOptions[option]
        }

        return obj
    }, {})

    return options
}
