import { isVisualizationEmpty } from './visualization'
import { DIMENSION_ID_ORGUNIT } from '@constants/dimensions'
import { AXIS, dimensionIsValid, layoutGetDimension } from '@dhis2/analytics'
import type { CurrentVisualization } from '@types'

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
    visualization: CurrentVisualization
): boolean => Boolean(visualization?.program?.id)

const visualizationHasTrackedEntityTypeId = (
    visualization: CurrentVisualization
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
    visualization: CurrentVisualization
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
    visualization: CurrentVisualization
): boolean => {
    try {
        validateVisualization(visualization)

        return true
    } catch {
        return false
    }
}

// Validation functions for FileMenu actions
export const isVisualizationValidForSaveAs = (
    visualization: CurrentVisualization
): boolean =>
    visualization.outputType === 'TRACKED_ENTITY_INSTANCE'
        ? visualizationHasTrackedEntityTypeId(visualization)
        : visualizationHasProgramId(visualization)

export const isVisualizationValidForSave = (
    visualization: CurrentVisualization
): boolean =>
    !visualization.legacy && isVisualizationValidForSaveAs(visualization)
