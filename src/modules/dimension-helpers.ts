import { extractPlainDimensionId } from './dimension'
import type { DimensionType } from '@types'

/**
 * Helper functions for working with dimensions without artificial/app-specific dimension types.
 * These functions check dimension IDs and types directly rather than relying on mapped types.
 */

/**
 * Check if a dimension ID represents a status dimension (eventStatus or programStatus)
 */
export const isStatusDimension = (dimensionId: string): boolean => {
    const plainId = extractPlainDimensionId(dimensionId)
    return plainId === 'eventStatus' || plainId === 'programStatus'
}

/**
 * Check if a dimension ID represents a user dimension (createdBy or lastUpdatedBy)
 */
export const isUserDimension = (dimensionId: string): boolean => {
    const plainId = extractPlainDimensionId(dimensionId)
    return plainId === 'createdBy' || plainId === 'lastUpdatedBy'
}

/**
 * Check if a dimension type is a program-related dimension type
 */
export const isProgramDimensionType = (
    dimensionType: DimensionType | undefined
): boolean => {
    if (!dimensionType) {
        return false
    }
    return [
        'PROGRAM_DATA_ELEMENT',
        'CATEGORY',
        'CATEGORY_OPTION_GROUP_SET',
        'PROGRAM_ATTRIBUTE',
        'PROGRAM_INDICATOR',
    ].includes(dimensionType)
}

/**
 * Check if a dimension type is a "your dimensions" type
 */
export const isYourDimensionType = (
    dimensionType: DimensionType | undefined
): boolean => {
    if (!dimensionType) {
        return false
    }
    return dimensionType === 'ORGANISATION_UNIT_GROUP_SET'
}
