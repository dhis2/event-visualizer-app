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
