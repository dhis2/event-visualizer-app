import type { DimensionMetadataItem } from '@types'
import { expect, describe, it } from 'vitest'
import {
    isDimensionFullyInvalidForVisType,
    isDimensionTypeFullyInvalidForVisType,
    isObject,
    isPopulatedString,
} from '../validation'

describe('type-guards', () => {
    describe('isObject', () => {
        it('returns true for plain objects', () => {
            expect(isObject({})).toBe(true)
            expect(isObject({ key: 'value' })).toBe(true)
        })

        it('returns false for non-objects', () => {
            expect(isObject(null)).toBe(false)
            expect(isObject('string')).toBe(false)
            expect(isObject(123)).toBe(false)
            expect(isObject([])).toBe(false)
        })
    })

    describe('isPopulatedString', () => {
        it('returns true for non-empty strings', () => {
            expect(isPopulatedString('hello')).toBe(true)
            expect(isPopulatedString('a')).toBe(true)
            expect(isPopulatedString('123')).toBe(true)
        })

        it('returns false for empty string', () => {
            expect(isPopulatedString('')).toBe(false)
        })

        it('returns false for whitespace-only strings', () => {
            expect(isPopulatedString('   ')).toBe(false)
            expect(isPopulatedString('\t')).toBe(false)
            expect(isPopulatedString('\n')).toBe(false)
            expect(isPopulatedString(' \t\n ')).toBe(false)
        })

        it('returns false for non-strings', () => {
            expect(isPopulatedString(null)).toBe(false)
            expect(isPopulatedString(undefined)).toBe(false)
            expect(isPopulatedString(123)).toBe(false)
            expect(isPopulatedString({})).toBe(false)
            expect(isPopulatedString([])).toBe(false)
        })
    })
})

describe('isDimensionTypeFullyInvalidForVisType', () => {
    it('marks PROGRAM_INDICATOR invalid for PIVOT_TABLE', () => {
        expect(
            isDimensionTypeFullyInvalidForVisType(
                'PROGRAM_INDICATOR',
                'PIVOT_TABLE'
            )
        ).toBe(true)
    })

    it('marks PROGRAM_INDICATOR valid for LINE_LIST', () => {
        expect(
            isDimensionTypeFullyInvalidForVisType(
                'PROGRAM_INDICATOR',
                'LINE_LIST'
            )
        ).toBe(false)
    })

    it('marks DATA_ELEMENT valid for PIVOT_TABLE', () => {
        expect(
            isDimensionTypeFullyInvalidForVisType('DATA_ELEMENT', 'PIVOT_TABLE')
        ).toBe(false)
    })

    it('marks CATEGORY valid for PIVOT_TABLE', () => {
        expect(
            isDimensionTypeFullyInvalidForVisType('CATEGORY', 'PIVOT_TABLE')
        ).toBe(false)
    })
})

describe('isDimensionFullyInvalidForVisType', () => {
    const makeDim = (
        overrides: Partial<DimensionMetadataItem> = {}
    ): Partial<DimensionMetadataItem> => ({
        dimensionType: 'DATA_ELEMENT',
        dimensionId: 'someDimId',
        ...overrides,
    })

    it('returns false for any dimension when target is LINE_LIST', () => {
        expect(
            isDimensionFullyInvalidForVisType(
                makeDim({ dimensionType: 'PROGRAM_INDICATOR' }),
                'LINE_LIST'
            )
        ).toBe(false)
        expect(
            isDimensionFullyInvalidForVisType(
                makeDim({
                    dimensionId: 'enrollmentOu',
                    trackedEntityTypeId: 'tetId',
                }),
                'LINE_LIST'
            )
        ).toBe(false)
    })

    it('marks PROGRAM_INDICATOR invalid for PIVOT_TABLE', () => {
        expect(
            isDimensionFullyInvalidForVisType(
                makeDim({ dimensionType: 'PROGRAM_INDICATOR' }),
                'PIVOT_TABLE'
            )
        ).toBe(true)
    })

    it('marks TET registration OU invalid for PIVOT_TABLE', () => {
        expect(
            isDimensionFullyInvalidForVisType(
                makeDim({
                    dimensionId: 'enrollmentOu',
                    trackedEntityTypeId: 'tetId',
                }),
                'PIVOT_TABLE'
            )
        ).toBe(true)
    })

    it('marks program-scope enrollmentOu (no TET) valid for PIVOT_TABLE', () => {
        expect(
            isDimensionFullyInvalidForVisType(
                makeDim({ dimensionId: 'enrollmentOu' }),
                'PIVOT_TABLE'
            )
        ).toBe(false)
    })

    it('marks an ordinary numeric DATA_ELEMENT valid for PIVOT_TABLE', () => {
        expect(
            isDimensionFullyInvalidForVisType(
                makeDim({ dimensionType: 'DATA_ELEMENT' }),
                'PIVOT_TABLE'
            )
        ).toBe(false)
    })
})
