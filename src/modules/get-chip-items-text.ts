import i18n from '@dhis2/d2-i18n'
import type { LayoutDimension } from '@components/visualization-layout/chip'
import type { SupportedAxis } from '@constants/axis-types'
import type { SupportedInputType } from '@constants/input-types'

const DIMENSION_ID_ORGUNIT = 'ou'

type ChipDimension = Pick<
    LayoutDimension,
    'id' | 'dimensionType' | 'optionSet' | 'valueType'
>

interface GetChipItemsTextParams {
    dimension: ChipDimension
    conditionsLength: number | undefined
    itemsLength: number | undefined
    inputType: SupportedInputType
    axisId: SupportedAxis
}

export const getChipItemsText = ({
    dimension,
    conditionsLength,
    itemsLength,
    inputType,
    axisId,
}: GetChipItemsTextParams): string => {
    const { id, dimensionType, optionSet, valueType } = dimension

    if (
        ((['EVENT', 'ENROLLMENT'].includes(inputType) &&
            id === DIMENSION_ID_ORGUNIT) ||
            dimensionType === 'PERIOD') &&
        !itemsLength
    ) {
        return ''
    }

    if (['columns', 'rows'].includes(axisId)) {
        if (
            (!conditionsLength && !itemsLength) ||
            (valueType === 'TRUE_ONLY' && conditionsLength === 1) ||
            (valueType === 'BOOLEAN' && conditionsLength === 2)
        ) {
            return i18n.t('all')
        }
    }

    if (optionSet || itemsLength) {
        return itemsLength ? itemsLength.toString() : ''
    }

    return conditionsLength ? conditionsLength.toString() : ''
}
