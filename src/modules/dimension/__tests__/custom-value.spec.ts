import { canDimensionBeCustomValue } from '@modules/dimension/custom-value'
import { describe, expect, it } from 'vitest'

describe('canDimensionBeCustomValue', () => {
    it('accepts a numeric data element', () => {
        expect(
            canDimensionBeCustomValue({
                dimensionType: 'DATA_ELEMENT',
                valueType: 'INTEGER',
            })
        ).toBe(true)
    })

    it('accepts a numeric tracked entity attribute', () => {
        expect(
            canDimensionBeCustomValue({
                dimensionType: 'PROGRAM_ATTRIBUTE',
                valueType: 'NUMBER',
            })
        ).toBe(true)
    })

    it('rejects a non-numeric data element', () => {
        expect(
            canDimensionBeCustomValue({
                dimensionType: 'DATA_ELEMENT',
                valueType: 'TEXT',
            })
        ).toBe(false)
    })

    it('rejects a data element with no value type', () => {
        expect(
            canDimensionBeCustomValue({ dimensionType: 'DATA_ELEMENT' })
        ).toBe(false)
    })

    it('rejects dimension types that hold no value, whatever their value type', () => {
        expect(
            canDimensionBeCustomValue({
                dimensionType: 'PROGRAM_INDICATOR',
                valueType: 'NUMBER',
            })
        ).toBe(false)
        expect(
            canDimensionBeCustomValue({
                dimensionType: 'ORGANISATION_UNIT',
            })
        ).toBe(false)
        expect(
            canDimensionBeCustomValue({
                dimensionType: 'PERIOD',
            })
        ).toBe(false)
    })
})
