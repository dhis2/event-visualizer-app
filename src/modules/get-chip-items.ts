import i18n from '@dhis2/d2-i18n'
import type { SupportedAxis } from '@constants/axis-types'
import type { SupportedDimensionType } from '@constants/dimension-types'
import type { SupportedInputType } from '@constants/input-types'
import type { SupportedValueType } from '@constants/value-types'

const DIMENSION_ID_ORGUNIT = 'ou'

interface ChipDimension {
    id: string
    dimensionType?: SupportedDimensionType
    optionSet?: string
    valueType?: SupportedValueType
}

interface GetChipItemsParams {
    dimension: ChipDimension
    conditionsLength: number | undefined
    itemsLength: number | undefined
    inputType: SupportedInputType
    axisId: SupportedAxis
}

export const getChipItems = ({
    dimension,
    conditionsLength,
    itemsLength,
    inputType,
    axisId,
}: GetChipItemsParams): string | number | null => {
    const { id, dimensionType, optionSet, valueType } = dimension

    if (
        ((inputType !== 'TRACKED_ENTITY_INSTANCE' &&
            id === DIMENSION_ID_ORGUNIT) ||
            dimensionType === 'PERIOD') &&
        !itemsLength
    ) {
        return null
    }

    if (!conditionsLength && !itemsLength && axisId !== 'filters') {
        return i18n.t('all')
    }

    if (
        ((valueType === 'TRUE_ONLY' && conditionsLength === 1) ||
            (valueType === 'BOOLEAN' && conditionsLength === 2)) &&
        axisId !== 'filters'
    ) {
        return i18n.t('all')
    }

    if (optionSet || itemsLength) {
        return itemsLength || conditionsLength || null
    } else if (conditionsLength) {
        return conditionsLength
    }

    return null
}
