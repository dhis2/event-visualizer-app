import type { DimensionId, DimensionType } from '@types'

export const getUiDimensionType = (
    dimensionId: DimensionId | string,
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
