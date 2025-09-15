import { getOptionsForRequest } from '@modules/options'
import type { CurrentVisualization, DimensionId } from '@types'

export type ParameterRecord = Record<DimensionId, unknown>

export const getRequestOptions = (visualization: CurrentVisualization) => {
    const options = getOptionsForRequest().reduce(
        (map, [option, props]): ParameterRecord => {
            // only add parameter if value !== default
            if (
                visualization[option] !== undefined &&
                visualization[option] !== props.defaultValue
            ) {
                map[option] = visualization[option]
            }

            return map
        },
        {} as ParameterRecord
    )

    return options
}
