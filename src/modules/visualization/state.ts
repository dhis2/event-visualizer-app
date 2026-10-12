import { AXES } from '@constants/axis'
import { DEFAULT_OPTIONS } from '@constants/options'
import { removeNonPersistedDimensionProperties } from '@modules/dimension/translation'
import type {
    CurrentVisualization,
    DimensionArray,
    EmptyVisualization,
    SavedVisualization,
    VisualizationState,
} from '@types'
import deepEqual from 'deep-equal'
import { toCurrentVis } from './current-vis'
import { isVisualizationEmpty } from './guards'

/* Rebuilt from the layout's dimensions rather than edited directly, so a real
 * change to any of them already shows up in the axis comparison. Comparing
 * them as well would only add false positives: the backend recomputes
 * programDimensions on every GET, in its own order, and returns more per entry
 * than the app can rebuild from the metadata store. */
const DERIVED_LAYOUT_FIELDS: ReadonlySet<string> = new Set([
    'trackedEntityType',
    'attributeDimensions',
    'programDimensions',
])

const DIMENSION_AXES = new Set<string>(AXES)

/* An option left out and an option set to its own default mean the same thing. */
export const isDefaultOptionValue = (key: string, value: unknown): boolean =>
    value === undefined ||
    deepEqual(value, (DEFAULT_OPTIONS as Record<string, unknown>)[key])

/* The API returns more per dimension than the app can rebuild from visUiConfig,
 * and none of that extra detail is an edit: option sets and legend sets come
 * back with their display name, and a repetition comes back with the dimension,
 * axis and program context the backend derives from the dimension owning it.
 * Reducing both sides to what the app itself can produce leaves only real
 * edits. */
const comparableAxis = (axis: DimensionArray = []): DimensionArray =>
    removeNonPersistedDimensionProperties(axis).map((dim) => {
        const comparableDim = { ...dim }

        // No items and an empty items array both mean "no selection".
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

const idOnly = (ref: unknown): unknown =>
    ref && typeof ref === 'object' && 'id' in ref
        ? { id: (ref as { id: string }).id }
        : ref

const isFieldEquivalent = (key: string, a: unknown, b: unknown): boolean => {
    /* The custom value: the API returns it with a display name and an
     * aggregation type, where visUiConfig holds nothing but the id. */
    if (key === 'value') {
        return deepEqual(idOnly(a), idOnly(b))
    }

    if (key in DEFAULT_OPTIONS) {
        const bothAtDefault =
            isDefaultOptionValue(key, a) && isDefaultOptionValue(key, b)

        return bothAtDefault || deepEqual(a, b)
    }

    if (DIMENSION_AXES.has(key)) {
        return deepEqual(
            comparableAxis(a as DimensionArray),
            comparableAxis(b as DimensionArray)
        )
    }

    if (DERIVED_LAYOUT_FIELDS.has(key)) {
        return true
    }

    return deepEqual(a, b)
}

/* Only the keys present on `completeVisualization` are compared, so it has to
 * carry the full CurrentVisualization key set: a key missing there is a key
 * that goes unchecked. */
export const areVisualizationsEquivalent = (
    visualization: CurrentVisualization | EmptyVisualization,
    completeVisualization: CurrentVisualization
): boolean => {
    const a = visualization as Record<string, unknown>
    const b = completeVisualization as Record<string, unknown>

    return Object.keys(b).every((key) => isFieldEquivalent(key, a[key], b[key]))
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
