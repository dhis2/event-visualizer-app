import { AXES } from '@constants/axis'
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
    EmptyVisualization,
    EventVisualizationOptions,
    SavedVisualization,
    VisualizationState,
} from '@types'
import deepEqual from 'deep-equal'
import { isVisualizationEmpty } from './guards'
import { removeDimensionPropertiesBeforeSaving } from './save'

// Keys on CurrentVisualization that are NOT part of EventVisualizationOptions.
// Combined with the option keys (derived from DEFAULT_OPTIONS below) this
// gives the full set of CurrentVisualization keys at runtime.
const CURRENT_VIS_NON_OPTION_KEYS: ReadonlyArray<
    Exclude<keyof CurrentVisualization, keyof EventVisualizationOptions>
> = [
    'type',
    'outputType',
    'columns',
    'rows',
    'filters',
    'trackedEntityType',
    'attributeDimensions',
    'sorting',
    'value',
    'id',
    'programDimensions',
]

const CURRENT_VIS_KEYS: ReadonlyArray<keyof CurrentVisualization> = [
    ...CURRENT_VIS_NON_OPTION_KEYS,
    ...(Object.keys(DEFAULT_OPTIONS) as Array<keyof EventVisualizationOptions>),
]

/**
 * Extracts the CurrentVisualization-shaped subset of a SavedVisualization.
 * Used to compare a saved visualization to the current (edited) one —
 * the current vis is already in CurrentVisualization shape, but the saved
 * vis carries extra fields (access, createdBy, …) that we don't care about
 * when determining whether there are unsaved changes.
 */
export const toCurrentVis = (
    savedVis: SavedVisualization
): CurrentVisualization => {
    const result: Record<string, unknown> = {}
    for (const key of CURRENT_VIS_KEYS) {
        if (savedVis[key] !== undefined) {
            result[key] = savedVis[key]
        }
    }
    return result as CurrentVisualization
}

/* Derived from the layout: any real change is already caught by comparing the
 * axes, so comparing these adds nothing. And the two array fields
 * (programDimensions, attributeDimensions) can differ in order between a loaded
 * savedVis and a rebuilt currentVis — the app rebuilds them from the layout,
 * the backend returns its own order — which a direct compare would misread as
 * an edit. */
const DERIVED_LAYOUT_FIELDS: ReadonlySet<string> = new Set([
    'trackedEntityType',
    'attributeDimensions',
    'programDimensions',
])

const DIMENSION_AXES = new Set<string>(AXES)

/* A default-valued option and an absent one mean the same thing, so both count
 * as "at default" when comparing. */
export const isDefaultOptionValue = (key: string, value: unknown): boolean =>
    value === undefined ||
    deepEqual(value, (DEFAULT_OPTIONS as Record<string, unknown>)[key])

/* An axis prepared for comparison: drop the props that aren't persisted
 * (dimensionType, valueType — the API sends PROGRAM_DATA_ELEMENT where the
 * rebuilt vis has DATA_ELEMENT) and treat an empty items array as absent, so
 * unpersisted differences don't read as edits. */
const comparableAxis = (axis: DimensionArray = []): DimensionArray =>
    removeDimensionPropertiesBeforeSaving(axis).map((dim) => {
        if (Array.isArray(dim.items) && dim.items.length === 0) {
            const withoutItems = { ...dim }
            delete withoutItems.items
            return withoutItems
        }
        return dim
    })

/* Compares a saved vis to the current one, and the current one to the vis that
 * visUiConfig would produce. `visualizationB` must carry the full
 * CurrentVisualization key set, because its keys drive the comparison. */
export const areVisualizationsEquivalent = (
    visualizationA: CurrentVisualization,
    visualizationB: CurrentVisualization
): boolean => {
    const a = visualizationA as Record<string, unknown>
    const b = visualizationB as Record<string, unknown>
    for (const key of Object.keys(b)) {
        if (key in DEFAULT_OPTIONS) {
            const bothAtDefault =
                isDefaultOptionValue(key, a[key]) &&
                isDefaultOptionValue(key, b[key])
            if (!bothAtDefault && !deepEqual(a[key], b[key])) {
                return false
            }
        } else if (DIMENSION_AXES.has(key)) {
            if (
                !deepEqual(
                    comparableAxis(a[key] as DimensionArray),
                    comparableAxis(b[key] as DimensionArray)
                )
            ) {
                return false
            }
        } else if (
            !DERIVED_LAYOUT_FIELDS.has(key) &&
            !deepEqual(a[key], b[key])
        ) {
            return false
        }
    }
    return true
}

export const getVisualizationState = (
    savedVis: SavedVisualization | EmptyVisualization,
    currentVis: CurrentVisualization | EmptyVisualization
): VisualizationState => {
    if (isVisualizationEmpty(savedVis)) {
        return isVisualizationEmpty(currentVis) ? 'EMPTY' : 'UNSAVED'
    } else if (isVisualizationEmpty(currentVis)) {
        return 'DIRTY'
    } else if (
        areVisualizationsEquivalent(toCurrentVis(savedVis), currentVis)
    ) {
        return 'SAVED'
    } else {
        return 'DIRTY'
    }
}

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
