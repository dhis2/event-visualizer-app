import i18n from '@dhis2/d2-i18n'
import { dimensionCreate } from '@dhis2/analytics'
import { parseUiRepetitions } from '@modules/repetitions'
import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import type { Axis, DimensionIdentifier, Layout, LayoutDimension } from '@types'

export const getAxisName = (axisId: Axis): string => getAxisNames()[axisId]

export const getAxisNames = (): Record<Axis, string> => ({
    columns: i18n.t('Columns'),
    filters: i18n.t('Filter'),
    rows: i18n.t('Rows'),
})

export const isDimensionInLayout = (
    layout: Layout,
    identifier: DimensionIdentifier
): boolean => findDimensionInLayout(layout, identifier) !== undefined

export const formatLayoutForVisualization = (visUiConfig: VisUiConfigState) =>
    Object.entries(visUiConfig.layout).reduce(
        (layout, [axisId, dimensions]: [string, LayoutDimension[]]) => ({
            ...layout,
            [axisId]: dimensions
                .map((dimension) => {
                    const options: Record<string, unknown> = {
                        filter: dimension.conditions?.condition,
                    }

                    if (dimension.conditions?.legendSet) {
                        options.legendSet = {
                            id: dimension.conditions.legendSet,
                        }
                    }

                    if (dimension.repetitions) {
                        options.repetition = {
                            indexes: parseUiRepetitions(dimension.repetitions),
                        }
                    }

                    if (dimension.programId) {
                        options.program = {
                            id: dimension.programId,
                        }
                    }

                    if (dimension.programStageId) {
                        options.programStage = {
                            id: dimension.programStageId,
                        }
                    }

                    return dimensionCreate(
                        dimension.id,
                        dimension.items,
                        options
                    )
                })
                .filter(Boolean),
        }),
        {}
    )
/**
 * Checks if a dimension matches the given identifier.
 * A dimension matches if all context fields (programId, programStageId, etc.) are equal.
 * Both must have the same fields defined - undefined in one and defined in the other is a mismatch.
 */
export const dimensionMatches = (
    dimension: LayoutDimension,
    identifier: DimensionIdentifier
): boolean => {
    if (dimension.id !== identifier.id) {
        return false
    }
    if (dimension.programId !== identifier.programId) {
        return false
    }
    if (dimension.programStageId !== identifier.programStageId) {
        return false
    }
    if (dimension.trackedEntityTypeId !== identifier.trackedEntityTypeId) {
        return false
    }
    if (dimension.repetitionIndex !== identifier.repetitionIndex) {
        return false
    }
    return true
}

/**
 * Finds a dimension in an array by its identifier.
 * Returns undefined if not found.
 */
export const findDimensionInLayout = (
    layout: Layout,
    identifier: DimensionIdentifier
): LayoutDimension | undefined =>
    layout.rows.find((d) => dimensionMatches(d, identifier)) ??
    layout.columns.find((d) => dimensionMatches(d, identifier)) ??
    layout.filters.find((d) => dimensionMatches(d, identifier))
