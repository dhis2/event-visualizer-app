import { ANALYTICS_OPTIONS } from '@constants/options'
import type { CurrentVisualization, DimensionId } from '@types'

export type ParameterRecord = Record<DimensionId, unknown>

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
