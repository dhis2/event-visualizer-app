import { getAnalyticsRequestDimensionName } from '@modules/analytics-request'
import { WIRE_ONLY_DIMENSIONS } from '@modules/dimension/ids'
import type {
    Axis,
    CurrentVisualization,
    DimensionArray,
    OutputType,
} from '@types'
import { getRequestOptions } from './query-tools-common'

const adaptDimensions = (
    dimensions: DimensionArray,
    visualization: CurrentVisualization
): DimensionArray =>
    dimensions
        .filter((dim) => !WIRE_ONLY_DIMENSIONS.has(dim.dimension))
        .map((dim) => ({
            ...dim,
            dimension: getAnalyticsRequestDimensionName({
                dimensionId: dim.dimension,
                programId: dim.program?.id,
                programStageId: dim.programStage?.id,
                trackedEntityTypeId: visualization.trackedEntityType?.id,
                outputType: visualization.outputType,
            }),
            program: undefined,
            programStage: undefined,
        }))

export const getAdaptedVisualization = (
    visualization: CurrentVisualization
): {
    adaptedVisualization: Record<Axis, object[]> & {
        outputType: OutputType
    }
    parameters: Record<string, unknown>
} => {
    const parameters = getRequestOptions(visualization)

    const columns = visualization.columns ?? []
    const rows = visualization.rows ?? []
    const filters = visualization.filters ?? []

    return {
        adaptedVisualization: {
            columns: adaptDimensions(columns, visualization),
            rows: adaptDimensions(rows, visualization),
            filters: adaptDimensions(filters, visualization),
            outputType: visualization.outputType,
        },
        parameters,
    }
}
