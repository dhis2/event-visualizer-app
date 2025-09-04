import i18n from '@dhis2/d2-i18n'
import { AXIS_ID_FILTERS } from '@constants/axis-types'
import { DIMENSION_TYPE_PERIOD } from '@constants/dimension-types'
import { INPUT_TYPE_TRACKED_ENTITY } from '@constants/input-types'
import { VALUE_TYPE_TRUE_ONLY, VALUE_TYPE_BOOLEAN } from '@constants/value-types'

const DIMENSION_ID_ORGUNIT = 'ou'

const VALUE_TYPE_TRUE_ONLY_NUM_OPTIONS = 1
const VALUE_TYPE_BOOLEAN_NUM_OPTIONS = 2

export const getChipItems = ({
    dimension,
    conditionsLength,
    itemsLength,
    inputType,
    axisId,
}) => {
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
        ((valueType === VALUE_TYPE_TRUE_ONLY &&
            conditionsLength === VALUE_TYPE_TRUE_ONLY_NUM_OPTIONS) ||
            (valueType === VALUE_TYPE_BOOLEAN &&
                conditionsLength === VALUE_TYPE_BOOLEAN_NUM_OPTIONS)) &&
        axisId !== AXIS_ID_FILTERS
    ) {
        return i18n.t('all')
    }

    if (optionSet || itemsLength) {
        return itemsLength || conditionsLength
    } else if (conditionsLength) {
        return conditionsLength
    }
}
