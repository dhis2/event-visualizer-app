import { AXES } from '@constants/axis'
import { DEFAULT_OPTIONS } from '@constants/options'
import { removeDimensionPropertiesBeforeSaving } from '@modules/dimension/translation'
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

/* Top-level metadata refs the API returns with a display name (and, for the
 * custom value, its aggregation type) where visUiConfig can only rebuild the
 * id. Compared by id, for the same reason comparableAxis reduces optionSet and
 * legendSet. */
const ID_REF_FIELDS: ReadonlySet<string> = new Set(['value'])

const comparableIdRef = (ref: unknown): unknown =>
    ref && typeof ref === 'object' && 'id' in ref
        ? { id: (ref as { id: string }).id }
        : ref

/* How one field of two visualizations compares. Each kind of field has its own
 * notion of equivalence: a metadata ref by id, an option with an absent value
 * counting as its default, an axis after normalisation, and the layout-derived
 * fields not at all. */
const isFieldEquivalent = (key: string, a: unknown, b: unknown): boolean => {
    if (ID_REF_FIELDS.has(key)) {
        return deepEqual(comparableIdRef(a), comparableIdRef(b))
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

    return DERIVED_LAYOUT_FIELDS.has(key) || deepEqual(a, b)
}

/* Compares a saved vis to the current one, and the current one to the vis that
 * visUiConfig would produce. `visualizationB` must carry the full
 * CurrentVisualization key set, because its keys drive the comparison. */
export const areVisualizationsEquivalent = (
    visualizationA: CurrentVisualization | EmptyVisualization,
    visualizationB: CurrentVisualization
): boolean => {
    const a = visualizationA as Record<string, unknown>
    const b = visualizationB as Record<string, unknown>

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
