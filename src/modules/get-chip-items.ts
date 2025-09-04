import i18n from '@dhis2/d2-i18n'
import { AXIS_ID_FILTERS } from '@constants/axis-types'
import type { SupportedAxisId } from '@constants/axis-types'
import { DIMENSION_TYPE_PERIOD } from '@constants/dimension-types'
import type { SupportedDimensionType } from '@constants/dimension-types'
import { INPUT_TYPE_TRACKED_ENTITY } from '@constants/input-types'
import type { InputType } from '@constants/input-types'
import {
    VALUE_TYPE_TRUE_ONLY,
    VALUE_TYPE_BOOLEAN,
} from '@constants/value-types'
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
    inputType: InputType
    axisId: SupportedAxisId
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
        ((inputType !== INPUT_TYPE_TRACKED_ENTITY &&
            id === DIMENSION_ID_ORGUNIT) ||
            dimensionType === DIMENSION_TYPE_PERIOD) &&
        !itemsLength
    ) {
        return null
    }

    if (!conditionsLength && !itemsLength && axisId !== AXIS_ID_FILTERS) {
        return i18n.t('all')
    }

    if (
        ((valueType === VALUE_TYPE_TRUE_ONLY && conditionsLength === 1) ||
            (valueType === VALUE_TYPE_BOOLEAN && conditionsLength === 2)) &&
        axisId !== AXIS_ID_FILTERS
    ) {
        return i18n.t('all')
    }

    if (optionSet || itemsLength) {
        return itemsLength || conditionsLength || 0
    } else if (conditionsLength) {
        return conditionsLength
    }

    return null
}
