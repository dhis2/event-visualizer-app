import type { CurrentVisualization, EmptyVisualization } from '@types'

const getProgramDimensionsCount = (
    visualization: CurrentVisualization | EmptyVisualization
): number => {
    if (!('programDimensions' in visualization)) {
        return 0
    }
    return visualization.programDimensions?.length ?? 0
}

// Helper function to check if input is a plain object
export const isObject = (input: unknown): input is Record<string, unknown> => {
    return typeof input === 'object' && input !== null && !Array.isArray(input)
}

// Helper function to check if input is a non-empty string
export const isPopulatedString = (input: unknown): input is string => {
    return typeof input === 'string' && input.trim().length > 0
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
