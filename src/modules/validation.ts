import { DIMENSION_ID_ORGUNIT } from '@constants/dimensions'
import { AXIS, dimensionIsValid, layoutGetDimension } from '@dhis2/analytics'
import type {
    CurrentVisualization,
    DimensionMetadataItem,
    DimensionType,
    EmptyVisualization,
    VisualizationType,
} from '@types'
import { isVisualizationEmpty } from './visualization'

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

// Layout validation helper functions
const isAxisValid = (axis) =>
    AXIS.isValid(axis) &&
    axis.some((axisItem) =>
        dimensionIsValid(axisItem, {
            requireItems: false,
        })
    )

const visualizationHasProgramId = (
    visualization: CurrentVisualization | EmptyVisualization
): boolean => getProgramDimensionsCount(visualization) > 0

const visualizationHasTrackedEntityTypeId = (
    visualization: CurrentVisualization | EmptyVisualization
): boolean => Boolean(visualization?.trackedEntityType?.id)

// Validation functions for Update and Download
const validateLineListVisualization = (
    visualization: CurrentVisualization
): void => {
    // entity type (input type TE only)
    if (
        visualization.outputType === 'TRACKED_ENTITY_INSTANCE' &&
        !visualizationHasTrackedEntityTypeId(visualization)
    ) {
        // TODO: noEntityTypeError()
        throw new Error('No tracked entity type selected')
    }

    // program
    if (
        visualization.outputType !== 'TRACKED_ENTITY_INSTANCE' &&
        !visualizationHasProgramId(visualization)
    ) {
        // noProgramError()
        throw new Error('No program selected')
    }

    // columns
    if (!isAxisValid(visualization.columns)) {
        // TODO: noColumnsError()
        throw new Error('Columns is empty')
    }

    // organisation unit
    const ouDimension = layoutGetDimension(visualization, DIMENSION_ID_ORGUNIT)
    if (
        visualization.outputType !== 'TRACKED_ENTITY_INSTANCE' &&
        !(ouDimension && dimensionIsValid(ouDimension, { requireItems: true }))
    ) {
        // TODO: noOrgUnitError()
        throw new Error('No organisation unit selected')
    }
}

export const validateVisualization = (
    visualization: CurrentVisualization | EmptyVisualization
): void => {
    if (isVisualizationEmpty(visualization)) {
        throw new Error('Empty visualization')
    } else {
        switch (visualization.type) {
            case 'LINE_LIST': {
                validateLineListVisualization(visualization)

                break
            }
            default: {
                throw new Error(`Not implemented for ${visualization.type}`)
            }
        }
    }
}

export const isVisualizationValid = (
    visualization: CurrentVisualization | EmptyVisualization
): boolean => {
    try {
        validateVisualization(visualization)

        return true
    } catch {
        return false
    }
}

// Shape check: does the visualization carry the minimum fields required for
// the API to accept a save payload (POST or PUT). Weaker than
// `isVisualizationValid` (which also requires columns and org unit for
// render).
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
