/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, describe, it } from 'vitest'
import { isObject, isPopulatedString } from '../validation'

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
