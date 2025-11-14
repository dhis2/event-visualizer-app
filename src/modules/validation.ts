import { DIMENSION_ID_ORGUNIT } from '@constants/dimensions'
import { AXIS, dimensionIsValid, layoutGetDimension } from '@dhis2/analytics'
import type { CurrentVisualization } from '@types'

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
const isVisualizationValidLineList = (
    visualization: CurrentVisualization,
    { dryRun = false }: { dryRun?: boolean } = {}
): boolean => {
    if (!visualization) {
        return false
    }

    // entity type (input type TE only)
    if (
        visualization.outputType === 'TRACKED_ENTITY_INSTANCE' &&
        !visualizationHasTrackedEntityTypeId(visualization)
    ) {
        if (dryRun) {
            return false
        }
        //throw noEntityTypeError()
    }

    // program
    if (
        visualization.outputType !== 'TRACKED_ENTITY_INSTANCE' &&
        !visualizationHasProgramId(visualization)
    ) {
        if (dryRun) {
            return false
        }
        //throw noProgramError()
    }

    // columns
    if (!isAxisValid(visualization.columns)) {
        if (dryRun) {
            return false
        }
        //throw noColumnsError()
    }

    // organisation unit
    const ouDimension = layoutGetDimension(visualization, DIMENSION_ID_ORGUNIT)
    if (
        visualization.outputType !== 'TRACKED_ENTITY_INSTANCE' &&
        !(ouDimension && dimensionIsValid(ouDimension, { requireItems: true }))
    ) {
        if (dryRun) {
            return false
        }
        //throw noOrgUnitError()
    }

    return true
}

export const isVisualizationValid = (
    visualization: CurrentVisualization,
    args?: { dryRun: boolean }
): boolean => {
    switch (visualization.type) {
        case 'LINE_LIST':
            return isVisualizationValidLineList(visualization, args)
        default:
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
