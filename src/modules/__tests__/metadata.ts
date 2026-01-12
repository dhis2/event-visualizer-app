/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, describe, it } from 'vitest'
import {
    isMetadataInputItem,
    isMetadataItemWithName,
    isProgramMetadataItem,
    isProgramStageMetadataItem,
    isOptionSetMetadataItem,
    isLegendSetMetadataItem,
    isOrganisationUnitMetadataItem,
    isUserOrgUnitMetadataItem,
    isMetadataItem,
} from '../metadata'

describe('type-guards', () => {
    describe('isMetadataInputItem', () => {
        it('returns true for valid input items with id', () => {
            expect(isMetadataInputItem({ id: 'test123' })).toBe(true)
            expect(isMetadataInputItem({ id: 'test123', name: 'Test' })).toBe(
                true
            )
        })

        it('returns true for valid input items with uid', () => {
            expect(isMetadataInputItem({ uid: 'test123' })).toBe(true)
            expect(
                isMetadataInputItem({ uid: 'test123', displayName: 'Test' })
            ).toBe(true)
        })

        it('returns false for invalid input items', () => {
            expect(isMetadataInputItem({})).toBe(false)
            expect(isMetadataInputItem({ id: '', uid: 'test' })).toBe(false)
            expect(isMetadataInputItem({ id: 'test', uid: 'test' })).toBe(false)
            expect(isMetadataInputItem(null)).toBe(false)
        })
    })

    describe('isMetadataItemWithName', () => {
        it('returns true for objects with id and name', () => {
            expect(
                isMetadataItemWithName({ id: 'test123', name: 'Test Name' })
            ).toBe(true)
        })

        it('returns false for objects missing id or name', () => {
            expect(isMetadataItemWithName({ name: 'Test' })).toBe(false)
            expect(isMetadataItemWithName({ id: 'test' })).toBe(false)
            expect(isMetadataItemWithName({})).toBe(false)
        })
    })

    describe('isMetadataItem', () => {
        it('returns true for MetadataItemWithName objects', () => {
            expect(isMetadataItem({ id: 'test123', name: 'Test Name' })).toBe(
                true
            )
        })

        it('returns true for LegendSetMetadataItem objects', () => {
            expect(isMetadataItem({ id: 'legend123', legends: [] })).toBe(true)
        })

        it('returns true for OptionSetMetadataItem objects', () => {
            expect(isMetadataItem({ id: 'option123', options: [] })).toBe(true)
        })

        it('returns false for invalid objects', () => {
            expect(isMetadataItem({ uid: 'test' })).toBe(false)
            expect(isMetadataItem({})).toBe(false)
        })
    })

    describe('isProgramMetadataItem', () => {
        it('returns true for valid program items', () => {
            expect(
                isProgramMetadataItem({
                    id: 'prog123',
                    programType: 'WITH_REGISTRATION',
                    name: 'Test Program',
                })
            ).toBe(true)
        })

        it('returns false for invalid program items', () => {
            expect(isProgramMetadataItem({ id: 'test' })).toBe(false)
            expect(isProgramMetadataItem({})).toBe(false)
        })
    })

    describe('isProgramStageMetadataItem', () => {
        it('returns true for valid program stage items', () => {
            expect(
                isProgramStageMetadataItem({
                    id: 'stage123',
                    name: 'Test Stage',
                    repeatable: false,
                    hideDueDate: true,
                })
            ).toBe(true)
        })

        it('returns false for invalid program stage items', () => {
            expect(isProgramStageMetadataItem({ id: 'test' })).toBe(false)
            expect(isProgramStageMetadataItem({})).toBe(false)
        })
    })

    describe('isOptionSetMetadataItem', () => {
        it('returns true for valid option set items', () => {
            expect(
                isOptionSetMetadataItem({
                    id: 'opt123',
                    options: [],
                })
            ).toBe(true)
        })

        it('returns false for invalid option set items', () => {
            expect(isOptionSetMetadataItem({ id: 'test' })).toBe(false)
            expect(isOptionSetMetadataItem({})).toBe(false)
        })
    })

    describe('isLegendSetMetadataItem', () => {
        it('returns true for valid legend set items', () => {
            expect(
                isLegendSetMetadataItem({
                    id: 'legend123',
                    legends: [],
                })
            ).toBe(true)
        })

        it('returns false for invalid legend set items', () => {
            expect(isLegendSetMetadataItem({ id: 'test' })).toBe(false)
            expect(isLegendSetMetadataItem({})).toBe(false)
        })
    })

    describe('isOrganisationUnitMetadataItem', () => {
        it('returns true for valid org unit items', () => {
            expect(
                isOrganisationUnitMetadataItem({
                    id: 'org123',
                    path: '/path',
                })
            ).toBe(true)
        })

        it('returns false for invalid org unit items', () => {
            expect(isOrganisationUnitMetadataItem({ id: 'test' })).toBe(false)
            expect(isOrganisationUnitMetadataItem({})).toBe(false)
        })
    })

    describe('isUserOrgUnitMetadataItem', () => {
        it('returns true for valid user org unit items', () => {
            expect(
                isUserOrgUnitMetadataItem({
                    id: 'user123',
                    name: 'User Org Unit',
                    organisationUnits: ['ou1'],
                })
            ).toBe(true)
        })

        it('returns false for invalid user org unit items', () => {
            expect(isUserOrgUnitMetadataItem({ id: 'test' })).toBe(false)
            expect(isUserOrgUnitMetadataItem({})).toBe(false)
        })
    })
})
