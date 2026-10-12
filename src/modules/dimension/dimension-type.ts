import type { DimensionType } from '@types'

export const getUiDimensionType = (
    dimensionId: string,
    dimensionType: DimensionType | 'PROGRAM_DATA_ELEMENT'
): DimensionType => {
    if (dimensionType === 'PROGRAM_DATA_ELEMENT') {
        return 'DATA_ELEMENT'
    }
    switch (dimensionId) {
        case 'programStatus':
        case 'eventStatus':
            return 'STATUS'

        case 'createdBy':
        case 'lastUpdatedBy':
            return 'USER'

        default:
            return dimensionType
    }
}

const ITEM_BASED_DIMENSION_TYPES: ReadonlySet<DimensionType> = new Set([
    'CATEGORY',
    'CATEGORY_OPTION_GROUP_SET',
    'ORGANISATION_UNIT_GROUP_SET',
    'STATUS',
    'PERIOD',
    'ORGANISATION_UNIT',
])

/* Item-based dimensions are narrowed by selecting items; the rest by value
 * conditions. */
export const isItemBasedDimensionType = (dimensionType: DimensionType) =>
    ITEM_BASED_DIMENSION_TYPES.has(dimensionType)
