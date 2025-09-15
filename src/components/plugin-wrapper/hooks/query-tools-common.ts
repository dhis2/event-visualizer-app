import { getOptionsForRequest } from '@modules/options'
import type { CurrentVisualization, DimensionId } from '@types'

export type ParameterRecord = Record<DimensionId, unknown>

// This should be refactored when the work on Options is done.
// See: https://dhis2.atlassian.net/browse/DHIS2-19823
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
