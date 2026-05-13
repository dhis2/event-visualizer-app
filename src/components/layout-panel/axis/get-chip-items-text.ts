import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import i18n from '@dhis2/d2-i18n'
import type { Axis } from '@types'

type ChipDimension = Pick<
    LayoutDimension,
    'dimensionType' | 'optionSet' | 'trackedEntityTypeId' | 'valueType'
>

interface GetChipItemsTextParams {
    dimension: ChipDimension
    conditionsLength: number | undefined
    itemsLength: number | undefined
    axisId: Axis
}

export const getChipItemsText = ({
    dimension,
    conditionsLength,
    itemsLength,
    axisId,
}: GetChipItemsTextParams): string => {
    const { dimensionType, optionSet, trackedEntityTypeId, valueType } =
        dimension

    /* OU and PERIOD dimensions have implicit defaults (USER_ORGUNIT and
     * a relative period), so an empty itemsList isn't really "all" — keep the
     * chip text empty. TE-scope OU (registration org unit) is the exception:
     * it's treated like any other dim. */
    const hasImplicitDefault =
        (dimensionType === 'ORGANISATION_UNIT' && !trackedEntityTypeId) ||
        dimensionType === 'PERIOD'

    if (hasImplicitDefault && !itemsLength) {
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
        const count = itemsLength || conditionsLength
        return typeof count === 'number' && count > 0 ? count.toString() : ''
    }

    return typeof conditionsLength === 'number' && conditionsLength > 0
        ? conditionsLength.toString()
        : ''
}
