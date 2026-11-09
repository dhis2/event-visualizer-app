import { isValueTypeNumeric } from '@modules/value-type'
import { getTetId } from '@modules/visualization/tracked-entity-type'
import type {
    CellValueRef,
    AggregatableDimension,
    DimensionMetadataItem,
    DimensionType,
    MetadataStore,
    SavedVisualization,
} from '@types'

/* Whether a dimension can stand as the cell value at all. Only numeric-ness is
 * judged here: whether the choice suits the layout and the output type is
 * decided separately by the output type buttons, which is the only place that
 * question has an answer — the same selection can be valid for one output type
 * and invalid for another at the same moment. */
export const isValidCellValueDimension = (
    dimension: Pick<DimensionMetadataItem, 'valueType'> | undefined
): boolean =>
    Boolean(dimension?.valueType && isValueTypeNumeric(dimension.valueType))

export const getCellValueRef = ({
    id,
    programStage,
}: CellValueRef): CellValueRef => ({
    id,
    ...(programStage && { programStage: { id: programStage.id } }),
})

/* The API names the item behind the cell value only by which field holds it. */
export const getCellValueItem = (
    visualization: Pick<
        SavedVisualization,
        'value' | 'dataElementValueDimension' | 'attributeValueDimension'
    >
): (AggregatableDimension & { dimensionType: DimensionType }) | undefined => {
    if (!visualization.value) {
        return undefined
    }
    if (visualization.dataElementValueDimension) {
        return {
            ...visualization.dataElementValueDimension,
            dimensionType: 'DATA_ELEMENT',
        }
    }
    if (visualization.attributeValueDimension) {
        return {
            ...visualization.attributeValueDimension,
            dimensionType: 'PROGRAM_ATTRIBUTE',
        }
    }
    return undefined
}

/* The dimension id analytics reads the cell value by. Only the stage qualifies
 * it: a tracked entity attribute is sent unprefixed, the same way analytics
 * returns its headers. */
export const getCellValueAnalyticsId = (value: CellValueRef): string =>
    value.programStage ? `${value.programStage.id}.${value.id}` : value.id

/* Finds the cell value's metadata from what is saved: the id and the stage.
 * A value without a stage is a tracked entity attribute, keyed under the
 * tracked entity type when there is one, plain otherwise. */
export const getCellValueMetadataItemOrThrow = (
    value: CellValueRef,
    visualization: Pick<
        SavedVisualization,
        'trackedEntityType' | 'programDimensions'
    >,
    metadataStore: MetadataStore
): DimensionMetadataItem => {
    if (value.programStage) {
        return metadataStore.getDimensionMetadataItemOrThrow(
            `${value.programStage.id}.${value.id}`
        )
    }

    const tetId = getTetId(visualization)
    const attributeItem = tetId
        ? metadataStore.getDimensionMetadataItem(`${tetId}.${value.id}`)
        : undefined

    return (
        attributeItem ?? metadataStore.getDimensionMetadataItemOrThrow(value.id)
    )
}
