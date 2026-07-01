import { USER_ORGUNIT } from '@constants/org-units'
import { extractPlainDimensionId } from '@modules/dimension/ids'
import { isTimeDimensionId } from '@modules/dimension/time'
import type { RelativePeriodEnum } from '@types'

export const getDefaultItemsForDimension = (
    dimensionId: string,
    defaultRelativePeriod?: RelativePeriodEnum
): string[] | undefined => {
    const plainId = extractPlainDimensionId(dimensionId)
    if (plainId === 'ou' || plainId === 'enrollmentOu') {
        return [USER_ORGUNIT]
    }
    if (defaultRelativePeriod && isTimeDimensionId(plainId)) {
        return [defaultRelativePeriod]
    }
    return undefined
}
