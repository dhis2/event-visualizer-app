import { layoutGetAllDimensions } from '@dhis2/analytics'
import { isTimeDimensionId } from '@modules/dimension/time'
import type {
    CurrentVisualization,
    EmptyVisualization,
    SavedVisualization,
} from '@types'

const getProgramDimensionsCount = (
    visualization: CurrentVisualization | EmptyVisualization
): number => {
    if (!('programDimensions' in visualization)) {
        return 0
    }
    return visualization.programDimensions?.length ?? 0
}

const visualizationHasProgramId = (
    visualization: CurrentVisualization | EmptyVisualization
): boolean => getProgramDimensionsCount(visualization) > 0

const visualizationHasTrackedEntityTypeId = (
    visualization: CurrentVisualization | EmptyVisualization
): boolean => Boolean(visualization?.trackedEntityType?.id)

// Shape check: does the visualization carry the minimum fields required for
// the API to accept a save payload (POST or PUT)
export const isVisualizationPersistable = (
    visualization: CurrentVisualization | EmptyVisualization
): boolean =>
    visualization.outputType === 'TRACKED_ENTITY_INSTANCE'
        ? visualizationHasTrackedEntityTypeId(visualization)
        : visualizationHasProgramId(visualization)

export const isVisualizationWithTimeDimension = (vis: CurrentVisualization) =>
    layoutGetAllDimensions(vis).some(
        ({ dimensionType, dimension, items }) =>
            (dimensionType === 'PERIOD' || isTimeDimensionId(dimension)) &&
            Array.isArray(items) &&
            items.length > 0
    )

export const isVisualizationEmpty = (
    visualization:
        CurrentVisualization | SavedVisualization | EmptyVisualization
): visualization is EmptyVisualization =>
    Object.keys(visualization).length === 0

// Structural check for the minimal fields shared by CurrentVisualization and
// SavedVisualization. Declaring the return as the union lets TypeScript
// narrow each slice input to its specific member (Empty is excluded either
// way), so we get useful narrowing in both currentVis and savedVis contexts
// without resorting to overloads.
const isPopulatedVisualization = (
    visualization:
        CurrentVisualization | SavedVisualization | EmptyVisualization
): visualization is SavedVisualization | CurrentVisualization => {
    const candidate = visualization as Partial<CurrentVisualization>
    return (
        typeof candidate.type === 'string' &&
        Array.isArray(candidate.columns) &&
        Array.isArray(candidate.rows) &&
        Array.isArray(candidate.filters)
    )
}

export const isSavedVisualization = (
    visualization: SavedVisualization | EmptyVisualization
): visualization is SavedVisualization =>
    isPopulatedVisualization(visualization) &&
    typeof visualization.id === 'string' &&
    // `access` is SavedVisualization-only: CurrentVisualization doesn't carry
    // it, so its presence distinguishes a full saved vis from a persisted
    // currentVis that merely has an id.
    'access' in visualization

export const isCurrentVisualizationPersisted = (
    visualization: CurrentVisualization | EmptyVisualization
): visualization is CurrentVisualization & { id: string } =>
    isPopulatedVisualization(visualization) &&
    typeof visualization.id === 'string'

export const isCurrentVisualizationNew = (
    visualization: CurrentVisualization | EmptyVisualization
): visualization is CurrentVisualization =>
    isPopulatedVisualization(visualization) &&
    typeof visualization.id !== 'string'
