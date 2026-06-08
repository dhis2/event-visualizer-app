import type {
    CurrentVisualization,
    DimensionMetadataItem,
    DimensionType,
    EmptyVisualization,
    VisualizationType,
} from '@types'

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

/* Per-dimension validity by visualization type. Used by the sidebar to
 * disable cards and individual chips, and by the conversion strategy to
 * decide which dimensions to discard when switching vis types. */

export const isDimensionTypeFullyInvalidForVisType = (
    dimensionType: DimensionType,
    visType: VisualizationType
): boolean => {
    if (visType === 'LINE_LIST') {
        return false
    }
    return dimensionType === 'PROGRAM_INDICATOR'
}

export const isDimensionFullyInvalidForVisType = (
    dim: Partial<
        Pick<
            DimensionMetadataItem,
            'dimensionType' | 'dimensionId' | 'trackedEntityTypeId'
        >
    >,
    visType: VisualizationType
): boolean => {
    if (visType === 'LINE_LIST') {
        return false
    }
    if (
        dim.dimensionType &&
        isDimensionTypeFullyInvalidForVisType(dim.dimensionType, visType)
    ) {
        return true
    }
    return dim.dimensionId === 'enrollmentOu' && !!dim.trackedEntityTypeId
}
