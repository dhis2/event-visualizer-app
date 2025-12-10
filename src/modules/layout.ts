import i18n from '@dhis2/d2-i18n'
import type { Axis, LayoutType } from '@types'

export const getAxisName = (axisId: Axis): string => getAxisNames()[axisId]

export const getAxisNames = (): Record<Axis, string> => ({
    columns: i18n.t('Columns'),
    filters: i18n.t('Filter'),
    rows: i18n.t('Rows'),
})

export const isDimensionInLayout = (
    layout: LayoutType,
    dimensionId: string
): boolean =>
    Object.values(layout)
        .reduce(
            (dimensionIds, axisDimensionIds) =>
                dimensionIds.concat(axisDimensionIds),
            []
        )
        .includes(dimensionId)
