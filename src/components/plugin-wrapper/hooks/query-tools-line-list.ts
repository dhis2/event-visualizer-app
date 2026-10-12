import { getAnalyticsRequestHeaderName } from '@modules/analytics-request'
import { DROPPED_LEGACY_DIMENSIONS } from '@modules/dimension/ids'
import type {
    Axis,
    CurrentVisualization,
    DimensionRecord,
    OutputType,
} from '@types'
import { adaptDimensions, getRequestOptions } from './query-tools-common'

const buildHeaderNames = (
    dim: DimensionRecord,
    visualization: CurrentVisualization
): string | string[] => {
    const baseArgs = {
        dimensionId: dim.dimension,
        programId: dim.program?.id,
        trackedEntityTypeId: visualization.trackedEntityType?.id,
        visualization,
    }
    const stageId = dim.programStage?.id

    if (dim.repetition?.indexes?.length && stageId) {
        return dim.repetition.indexes.map((index) =>
            getAnalyticsRequestHeaderName({
                ...baseArgs,
                programStageId: stageId,
                repetitionIndex: index,
            })
        )
    }
    return getAnalyticsRequestHeaderName({
        ...baseArgs,
        programStageId: stageId,
    })
}

/* A dimension reaches `dimension=` only when it constrains the query; one that
 * simply displays a value is requested through `headers=` alone. A legend set
 * counts as constraining, because it changes the response from raw values to
 * legend IDs. */
const isRequestedAsDimension = (dim: DimensionRecord): boolean =>
    dim.dimensionType === 'ORGANISATION_UNIT_GROUP_SET' ||
    Boolean(dim.filter) ||
    Boolean(dim.items?.length) ||
    Boolean(dim.legendSet?.id)

export const getAdaptedVisualization = (
    visualization: CurrentVisualization
): {
    adaptedVisualization: Record<Axis, object[]> & {
        outputType: OutputType
    }
    headers: (string | string[])[]
    parameters: Record<string, unknown>
} => {
    const parameters = getRequestOptions(visualization)

    const columns = visualization.columns ?? []
    const rows = visualization.rows ?? []
    const filters = visualization.filters ?? []

    const headers = [...columns, ...rows]
        .filter((dim) => !DROPPED_LEGACY_DIMENSIONS.has(dim.dimension))
        .map((dim) => buildHeaderNames(dim, visualization))

    return {
        adaptedVisualization: {
            columns: adaptDimensions(
                columns.filter(isRequestedAsDimension),
                visualization
            ),
            rows: adaptDimensions(
                rows.filter(isRequestedAsDimension),
                visualization
            ),
            filters: adaptDimensions(
                filters.filter(isRequestedAsDimension),
                visualization
            ),
            outputType: visualization.outputType,
        },
        headers,
        parameters,
    }
}

/* The identity of the request's dataset: the visualization plus
 * relativePeriodDate. Sorting, paging and displayProperty are excluded because
 * they refetch without a remount. */
export const getBaseRequestIdentity = (
    visualization: CurrentVisualization,
    relativePeriodDate?: string
) => ({
    ...getAdaptedVisualization(visualization),
    programIds: (visualization.programDimensions ?? []).map((p) => p.id),
    trackedEntityTypeId: visualization.trackedEntityType?.id,
    relativePeriodDate: relativePeriodDate ?? null,
})
