import {
    getAnalyticsRequestDimensionName,
    getAnalyticsRequestHeaderName,
} from '@modules/analytics-request'
import {
    getCompoundDimensionId,
    WIRE_ONLY_DIMENSIONS,
} from '@modules/dimension/ids'
import type {
    Axis,
    CurrentVisualization,
    DimensionArray,
    MetadataStore,
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

/* Names for the layout's dimensions, keyed the way the analytics response keys
 * `metaData.items`, so they override the backend's. The app has its own labels
 * and fallbacks (see modules/dimension/fixed.ts) that don't always match, and
 * some dimensions are missing from `metaData.items` altogether. This is done
 * for dimensions only — the values within them keep their backend names. */
export const getLayoutDimensionMetadataNames = (
    visualization: CurrentVisualization,
    metadataStore: MetadataStore
): Record<string, string> => {
    const trackedEntityTypeId = visualization.trackedEntityType?.id
    const dimensions = [
        ...(visualization.columns ?? []),
        ...(visualization.rows ?? []),
        ...(visualization.filters ?? []),
    ]

    return dimensions.reduce<Record<string, string>>((names, dim) => {
        const name = metadataStore.getDimensionMetadataItem(
            getCompoundDimensionId(
                dim,
                visualization.outputType,
                trackedEntityTypeId
            )
        )?.name

        if (name) {
            const key = getAnalyticsRequestHeaderName({
                dimensionId: dim.dimension,
                programId: dim.program?.id,
                programStageId: dim.programStage?.id,
                trackedEntityTypeId,
                visualization,
            })
            names[key] = name
        }

        return names
    }, {})
}

/* Custom value is only sent when both value and aggregationType are set. Shared
 * by the request builder and the identity so they can't disagree. */
export const getCustomValueRequestParams = (
    visualization: CurrentVisualization
) =>
    visualization.value && visualization.aggregationType
        ? {
              value: visualization.value.id,
              aggregationType: visualization.aggregationType,
          }
        : undefined

/* Like the line-list version, but pivot has no interactive sorting or paging,
 * so sortOrder, topLimit, timeField and the custom value are part of the
 * identity rather than excluded from it. */
export const getBaseRequestIdentity = (
    visualization: CurrentVisualization,
    relativePeriodDate?: string
) => ({
    ...getAdaptedVisualization(visualization),
    programIds: (visualization.programDimensions ?? []).map((p) => p.id),
    trackedEntityTypeId: visualization.trackedEntityType?.id,
    timeField: visualization.timeField,
    sortOrder: visualization.sortOrder,
    topLimit: visualization.topLimit,
    ...getCustomValueRequestParams(visualization),
    relativePeriodDate: relativePeriodDate ?? null,
})
