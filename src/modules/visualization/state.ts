import { AXES } from '@constants/axis'
import { DEFAULT_OPTIONS } from '@constants/options'
import { removeDimensionPropertiesBeforeSaving } from '@modules/dimension/translation'
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

/* An axis prepared for comparison. Two kinds of difference are not edits:
 * props that aren't persisted (dimensionType, valueType — the API sends
 * PROGRAM_DATA_ELEMENT where the rebuilt vis has DATA_ELEMENT) and nested
 * objects the API returns richer than the app can rebuild from visUiConfig
 * (option sets and legend sets carry their name; a repetition carries the
 * dimension, axis and program context the backend derives from the owning
 * dimension). An empty items array counts as absent. */
const comparableAxis = (axis: DimensionArray = []): DimensionArray =>
    removeDimensionPropertiesBeforeSaving(axis).map((dim) => {
        const comparableDim = { ...dim }
        if (Array.isArray(comparableDim.items) && !comparableDim.items.length) {
            delete comparableDim.items
        }
        if (comparableDim.optionSet) {
            comparableDim.optionSet = { id: comparableDim.optionSet.id }
        }
        if (comparableDim.legendSet) {
            comparableDim.legendSet = { id: comparableDim.legendSet.id }
        }
        if (comparableDim.repetition) {
            comparableDim.repetition = {
                indexes: comparableDim.repetition.indexes,
            }
        }
        return comparableDim
    })

/* The custom value is applied in one step by its own modal, so it can never
 * hold a change that is waiting to be applied — `value` and the
 * `aggregationType` that belongs to it are ignored when comparing the current
 * vis to the one visUiConfig would produce. A changed custom value *is* an
 * unsaved change, so the saved-vs-current comparison keeps them. */
export const CUSTOM_VALUE_FIELDS: ReadonlySet<string> = new Set([
    'value',
    'aggregationType',
])

type ComparisonOptions = {
    ignoredKeys?: ReadonlySet<string>
}

/* Compares a saved vis to the current one, and the current one to the vis that
 * visUiConfig would produce. `visualizationB` must carry the full
 * CurrentVisualization key set, because its keys drive the comparison. */
export const areVisualizationsEquivalent = (
    visualizationA: CurrentVisualization,
    visualizationB: CurrentVisualization,
    { ignoredKeys }: ComparisonOptions = {}
): boolean => {
    const a = visualizationA as Record<string, unknown>
    const b = visualizationB as Record<string, unknown>
    for (const key of Object.keys(b)) {
        if (ignoredKeys?.has(key)) {
            continue
        } else if (key in DEFAULT_OPTIONS) {
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
