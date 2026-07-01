import { visTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import type {
    DimensionMetadataItem,
    DimensionType,
    VisualizationType,
} from '@types'

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

export const isDimensionCrossTet = (
    dimensionTetId: string | null,
    layoutTetId: string | null
): boolean =>
    layoutTetId !== null &&
    dimensionTetId !== null &&
    dimensionTetId !== layoutTetId

// ─────────────────────────────────────────────────────────────────────────────
// Layout-blocking: whether — and why — a dimension cannot be placed in the layout
// ─────────────────────────────────────────────────────────────────────────────

export type DimensionBlockReason = 'customValue' | 'visType' | 'crossTet'

type DimensionBlockReasonInput = {
    dimension: DimensionMetadataItem
    visualizationType: VisualizationType
    customValueId: string | null
    layoutTetId: string | null
    dimensionTetId: string | null
}

/* Single source of truth for whether — and why — a dimension is blocked from
 * the layout, in precedence order. Both the item-level message and the
 * batch-add grouping derive from this. */
export const getDimensionBlockReason = ({
    dimension,
    visualizationType,
    customValueId,
    layoutTetId,
    dimensionTetId,
}: DimensionBlockReasonInput): DimensionBlockReason | null => {
    if (customValueId && dimension.id === customValueId) {
        return 'customValue'
    }
    if (isDimensionFullyInvalidForVisType(dimension, visualizationType)) {
        return 'visType'
    }
    if (isDimensionCrossTet(dimensionTetId, layoutTetId)) {
        return 'crossTet'
    }
    return null
}

export const getCrossTetMessage = (
    dataSourceTetName: string,
    layoutTetName: string
): string =>
    i18n.t(
        '{{- dataSourceTetName}} dimensions cannot be combined with {{- layoutTetName}} dimensions already in the layout.',
        { dataSourceTetName, layoutTetName }
    )

type DimensionDisablingInput = DimensionBlockReasonInput & {
    crossTetMessage: string
}

export const getDimensionLayoutBlockedMessage = (
    input: DimensionDisablingInput
): string | null => {
    switch (getDimensionBlockReason(input)) {
        case 'customValue':
            return i18n.t('Already used as custom value.')
        case 'visType':
            return i18n.t('Cannot be used in a {{visType}}.', {
                visType: visTypeDisplayNames[input.visualizationType],
            })
        case 'crossTet':
            return input.crossTetMessage
        default:
            return null
    }
}
