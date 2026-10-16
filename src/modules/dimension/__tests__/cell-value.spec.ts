import type { DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import { isValidCellValueDimension } from '../cell-value'

const dim = (valueType?: string) =>
    ({ valueType }) as unknown as DimensionMetadataItem

describe('isValidCellValueDimension', () => {
    it.each(['NUMBER', 'INTEGER', 'PERCENTAGE', 'BOOLEAN', 'TRUE_ONLY'])(
        'accepts %s, which aggregates numerically',
        (valueType) => {
            expect(isValidCellValueDimension(dim(valueType))).toBe(true)
        }
    )

    it.each(['TEXT', 'DATE', 'ORGANISATION_UNIT'])(
        'rejects %s',
        (valueType) => {
            expect(isValidCellValueDimension(dim(valueType))).toBe(false)
        }
    )

    /* Program indicators and the structural dimensions carry no value type. */
    it('rejects a dimension with no value type', () => {
        expect(isValidCellValueDimension(dim(undefined))).toBe(false)
    })

    it('rejects a dimension that is missing entirely', () => {
        expect(isValidCellValueDimension(undefined)).toBe(false)
    })
})
