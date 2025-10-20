import i18n from '@dhis2/d2-i18n'
import type { LayoutDimension } from '@components/layout-panel/chip'
import type { Axis, OutputType } from '@types'

const DIMENSION_ID_ORGUNIT = 'ou'

type ChipDimension = Pick<
    LayoutDimension,
    'id' | 'dimensionType' | 'optionSet' | 'valueType'
>

interface GetChipItemsTextParams {
    dimension: ChipDimension
    conditionsLength: number | undefined
    itemsLength: number | undefined
    outputType: OutputType
    axisId: Axis
}

export const getChipItemsText = ({
    dimension,
    conditionsLength,
    itemsLength,
    outputType,
    axisId,
}: GetChipItemsTextParams): string => {
    const { id, dimensionType, optionSet, valueType } = dimension

    if (
        ((['EVENT', 'ENROLLMENT'].includes(outputType) &&
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
