import { DEFAULT_OPTIONS } from '@constants/options'
import { getConditionsFromVisualization } from '@modules/conditions'
import {
    getCompoundDimensionId,
    WIRE_ONLY_DIMENSIONS,
} from '@modules/dimension/ids'
import { toAppLocalDimensions } from '@modules/dimension/translation'
import { getRepetitionsFromVisualisation } from '@modules/repetitions'
import type {
    CurrentVisualization,
    DimensionArray,
    EventVisualizationOptions,
} from '@types'

const toAppLocalAxes = (dims: DimensionArray): DimensionArray =>
    toAppLocalDimensions(
        dims.filter((dim) => !WIRE_ONLY_DIMENSIONS.has(dim.dimension))
    )

const OPTION_KEYS = Object.keys(DEFAULT_OPTIONS) as Array<
    keyof EventVisualizationOptions
>

const extractOptions = (
    vis: CurrentVisualization
): Partial<EventVisualizationOptions> => {
    const extracted: Record<string, unknown> = {}
    for (const key of OPTION_KEYS) {
        if (vis[key] !== undefined) {
            extracted[key] = vis[key]
        }
    }
    return extracted as Partial<EventVisualizationOptions>
}

export const getVisualizationUiConfig = (
    raw: CurrentVisualization,
    baseOptions: EventVisualizationOptions = DEFAULT_OPTIONS
) => {
    const vis: CurrentVisualization = {
        ...raw,
        columns: toAppLocalAxes(raw.columns ?? []),
        rows: toAppLocalAxes(raw.rows ?? []),
        filters: toAppLocalAxes(raw.filters ?? []),
    }
    const outputType = vis.outputType
    const tetId = vis.trackedEntityType?.id
    const toDimId = (dim: DimensionArray[number]) =>
        getCompoundDimensionId(dim, outputType, tetId)

    return {
        visualizationType: vis.type,
        outputType,
        layout: {
            columns: (vis.columns ?? []).map(toDimId),
            filters: (vis.filters ?? []).map(toDimId),
            rows: (vis.rows ?? []).map(toDimId),
        },
        itemsByDimension: [
            ...(vis.columns ?? []),
            ...(vis.rows ?? []),
            ...(vis.filters ?? []),
        ].reduce(
            (obj, dim) => {
                obj[toDimId(dim)] = (dim.items ?? [])
                    .map((item) => item.id)
                    .filter(Boolean) as string[]
                return obj
            },
            {} as Record<string, string[]>
        ),
        conditionsByDimension: getConditionsFromVisualization(vis, outputType),
        repetitionsByDimension: getRepetitionsFromVisualisation(vis),
        options: { ...baseOptions, ...extractOptions(vis) },
        ...(vis.value?.id && {
            customValue: {
                id: vis.value.id,
                aggregationType: vis.aggregationType || 'DEFAULT',
            },
        }),
    }
}
