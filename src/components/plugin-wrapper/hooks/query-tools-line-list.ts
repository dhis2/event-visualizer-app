import {
    getAnalyticsRequestDimensionName,
    getAnalyticsRequestHeaderName,
} from '@modules/analytics-request'
import { WIRE_ONLY_DIMENSIONS } from '@modules/dimension/ids'
import type {
    Axis,
    CurrentVisualization,
    DimensionArray,
    DimensionRecord,
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
                programStageId: `${stageId}[${index}]`,
            })
        )
    }
    return getAnalyticsRequestHeaderName({
        ...baseArgs,
        programStageId: stageId,
    })
}

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

    const adaptedColumns = adaptDimensions(columns, visualization)
    const adaptedRows = adaptDimensions(rows, visualization)
    const adaptedFilters = adaptDimensions(filters, visualization)

    const headers = [...columns, ...rows]
        .filter((dim) => !WIRE_ONLY_DIMENSIONS.has(dim.dimension))
        .map((dim) => buildHeaderNames(dim, visualization))

    const filterDimensionParameters = ({
        dimensionType,
        filter,
        items,
    }: DimensionRecord) =>
        dimensionType === 'ORGANISATION_UNIT_GROUP_SET' ||
        filter ||
        items?.length

    return {
        adaptedVisualization: {
            // only pass dimensions with conditions
            columns: adaptedColumns.filter(filterDimensionParameters),
            rows: adaptedRows.filter(filterDimensionParameters),
            filters: adaptedFilters.filter(filterDimensionParameters),
            outputType: visualization.outputType,
        },
        headers,
        parameters,
    }
}

/* The request as the visualization defines it, excluding the per-fetch runtime
 * layer (paging, interactive sorting, relativePeriodDate, displayProperty). */
export const getBaseRequestIdentity = (
    visualization: CurrentVisualization
) => ({
    ...getAdaptedVisualization(visualization),
    programIds: (visualization.programDimensions ?? []).map((p) => p.id),
    trackedEntityTypeId: visualization.trackedEntityType?.id,
})

const analyticsApiEndpointMap: Record<OutputType, string> = {
    ENROLLMENT: 'enrollments',
    EVENT: 'events',
    TRACKED_ENTITY_INSTANCE: 'trackedEntities',
}

export const getAnalyticsEndpoint = (outputType: OutputType): string =>
    analyticsApiEndpointMap[outputType]
