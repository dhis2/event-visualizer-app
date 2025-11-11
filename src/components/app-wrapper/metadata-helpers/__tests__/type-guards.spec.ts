/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, describe, it } from 'vitest'
import {
    isObject,
    isSingleMetadataItemInput,
    isMetadataItem,
    isSimpleMetadataItem,
    isProgramMetadataItem,
    isProgramStageMetadataItem,
    isOptionSetMetadataItem,
    isOrganisationUnitMetadataItem,
    isLegendSetMetadataItem,
    isUserOrgUnitMetadataItem,
    isUserOrgUnitMetadataInputItem,
} from '../type-guards'

describe('type-guards', () => {
    describe('isOrganisationUnitMetadataItem', () => {
        it('returns true for valid org unit', () => {
            const orgUnit = {
                name: 'Sierra Leone',
                path: '/ImspTQPwCqd',
                displayName: 'Sierra Leone',
                id: 'ImspTQPwCqd',
            }

            expect(isOrganisationUnitMetadataItem(orgUnit)).toBe(true)
        })

        it('returns false for invalid org unit', () => {
            expect(
                isOrganisationUnitMetadataItem({
                    path: '/A/B/C',
                    name: 'Test Org Unit',
                })
            ).toBe(false)
        })
    })
    describe('isObject', () => {
        it('should return true for plain objects', () => {
            expect(isObject({})).toBe(true)
            expect(isObject({ key: 'value' })).toBe(true)
        })

        it('should return false for non-objects', () => {
            expect(isObject(null)).toBe(false)
            expect(isObject('string')).toBe(false)
            expect(isObject(123)).toBe(false)
            expect(isObject([])).toBe(false)
        })
    })

    describe('isSingleMetadataItemInput', () => {
        it('should return true for valid MetadataItem objects', () => {
            expect(
                isSingleMetadataItemInput({ uid: 'test', name: 'Test' })
            ).toBe(true)
        })

        it('should return true for valid SimpleMetadataItem objects', () => {
            expect(isSingleMetadataItemInput({ key: 'value' })).toBe(true)
        })

        it('should return false for invalid objects', () => {
            expect(isSingleMetadataItemInput({})).toBe(false)
            expect(isSingleMetadataItemInput(null)).toBe(false)
        })
    })

    describe('isMetadataItem', () => {
        it('should return true for objects with both uid and name strings', () => {
            expect(isMetadataItem({ uid: 'test123', name: 'Test Name' })).toBe(
                true
            )
        })

        it('should return false for objects missing uid or name', () => {
            expect(isMetadataItem({ name: 'Test Name' })).toBe(false)
            expect(isMetadataItem({ uid: 'test123' })).toBe(false)
        })
    })

    describe('isSimpleMetadataItem', () => {
        it('should return true for objects with exactly one string key-value pair', () => {
            expect(isSimpleMetadataItem({ key: 'value' })).toBe(true)
        })

        it('should return false for objects with multiple properties', () => {
            expect(
                isSimpleMetadataItem({ key1: 'value1', key2: 'value2' })
            ).toBe(false)
        })
    })

    describe('isProgramMetadataItem', () => {
        it('should return true for valid program metadata items', () => {
            expect(
                isProgramMetadataItem({
                    id: 'prog123',
                    programType: 'WITH_REGISTRATION' as any,
                    name: 'Test Program',
                })
            ).toBe(true)
        })

        it('should return false for invalid program metadata items', () => {
            expect(
                isProgramMetadataItem({
                    programType: 'WITH_REGISTRATION',
                    name: 'Test',
                } as any)
            ).toBe(false)
        })
    })

    describe('isProgramStageMetadataItem', () => {
        it('should return true for valid program stage metadata items', () => {
            expect(
                isProgramStageMetadataItem({
                    id: 'stage123',
                    name: 'Test Program Stage',
                    repeatable: false,
                    hideDueDate: true,
                })
            ).toBe(true)
        })

        it('should return false for invalid program stage metadata items', () => {
            expect(
                isProgramStageMetadataItem({
                    name: 'Test',
                    repeatable: false,
                    hideDueDate: true,
                } as any)
            ).toBe(false)
        })
    })

    describe('isOptionSetMetadataItem', () => {
        it('should return true for valid option set metadata items', () => {
            expect(
                isOptionSetMetadataItem({
                    id: 'opt123',
                    name: 'Test Option Set',
                    options: [],
                } as any)
            ).toBe(true)
        })

        it('should return false for invalid option set metadata items', () => {
            expect(
                isOptionSetMetadataItem({
                    name: 'Test',
                    options: [],
                } as any)
            ).toBe(false)
        })
    })

    describe('isLegendSetMetadataItem', () => {
        it('should return true for valid LegendSetMetadataItem', () => {
            const item = {
                id: 'legend1',
                name: 'Test Legend Set',
                legends: [],
            }
            expect(isLegendSetMetadataItem(item)).toBe(true)
        })

        it('should return false for invalid LegendSetMetadataItem', () => {
            expect(
                isLegendSetMetadataItem({ id: 'legend1', name: 'Test' } as any)
            ).toBe(false)
        })
    })

    describe('isUserOrgUnitMetadataItem', () => {
        it('should return true for valid UserOrgUnitMetadataItem', () => {
            const item = {
                organisationUnits: ['ou1', 'ou2'],
                id: 'user-orgunit-id',
                name: 'User Org Unit Name',
            }
            expect(isUserOrgUnitMetadataItem(item)).toBe(true)
        })

        it('should return false for invalid UserOrgUnitMetadataItem', () => {
            expect(isUserOrgUnitMetadataItem({} as any)).toBe(false)
            expect(
                isUserOrgUnitMetadataItem({
                    organisationUnits: ['ou1'],
                } as any)
            ).toBe(false)
        })
    })

    describe('isUserOrgUnitMetadataInputItem', () => {
        it('should return true for valid UserOrgUnitMetadataInputItem', () => {
            const item = {
                organisationUnits: ['ou1', 'ou2'],
            }
            expect(isUserOrgUnitMetadataInputItem(item)).toBe(true)
        })

        it('should return false for invalid UserOrgUnitMetadataInputItem', () => {
            expect(isUserOrgUnitMetadataInputItem({} as any)).toBe(false)
            expect(
                isUserOrgUnitMetadataInputItem({
                    organisationUnits: ['ou1'],
                    extraProperty: 'invalid',
                } as any)
            ).toBe(false)
        })
    })
})
