import { getCompoundDimensionId } from '@modules/dimension/ids'
import { isValueTypeNumeric } from '@modules/value-type'
import { getTetId } from '@modules/visualization/tracked-entity-type'
import type { DimensionMetadataItem, SavedVisualization } from '@types'

/* Whether a dimension can stand as the cell value at all. Only numeric-ness is
 * judged here: whether the choice suits the layout and the output type is
 * decided separately by the output type buttons, which is the only place that
 * question has an answer — the same selection can be valid for one output type
 * and invalid for another at the same moment. */
export const isValidCellValueDimension = (
    dimension: Pick<DimensionMetadataItem, 'valueType'> | undefined
): boolean =>
    Boolean(dimension?.valueType && isValueTypeNumeric(dimension.valueType))

/* The id the app keys the cell value by, matching how it keys a layout
 * dimension, so the same data item dragged in and loaded back resolves to one
 * id. Only the stage has to come from the saved payload: a tracked entity
 * attribute's type is derived from the visualization, and the remaining rules
 * depend on nothing else. */
export const getCellValueCompoundId = (
    value: NonNullable<SavedVisualization['value']>,
    visualization: Pick<
        SavedVisualization,
        'trackedEntityType' | 'programDimensions'
    >
): string =>
    getCompoundDimensionId(
        {
            dimension: value.id,
            dimensionType: value.dimensionItemType,
            programStage: value.programStage,
        },
        getTetId(visualization)
    )
