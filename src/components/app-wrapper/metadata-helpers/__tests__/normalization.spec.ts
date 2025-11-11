import { describe, it, expect } from 'vitest'
import { normalizeMetadataInputItem } from '../normalization'
import type {
    AnyMetadataItemInput,
    MetadataStoreItem,
    UserOrgUnitMetadataInputItem,
    UserOrgUnitMetadataItem,
} from '../types'
import type { MetadataItem } from '@types'

describe('normalizeMetadataInputItem', () => {
    const mockMetadataMap = new Map<string, MetadataStoreItem>([
        [
            'USER_ORGUNIT',
            {
                id: 'USER_ORGUNIT',
                name: 'User Organisation Units',
                organisationUnits: [],
            } as UserOrgUnitMetadataItem,
        ],
    ])

    describe('normalizes MetadataItem', () => {
        it('converts uid to id and preserves other properties', () => {
            const input: MetadataItem = {
                uid: 'abc123',
                name: 'Test Item',
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toEqual({
                id: 'abc123',
                name: 'Test Item',
            })
        })
    })

    describe('normalizes SimpleMetadataItem', () => {
        it('sets id to the key and name to the value', () => {
            const input = { category: 'Health' } as AnyMetadataItemInput

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toEqual({
                id: 'category',
                name: 'Health',
            })
        })
    })

    describe('normalizes UserOrgUnitMetadataInputItem', () => {
        it('merges with existing USER_ORGUNIT metadata', () => {
            const input: UserOrgUnitMetadataInputItem = {
                organisationUnits: ['ou1', 'ou2'],
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toEqual({
                id: 'USER_ORGUNIT',
                name: 'User Organisation Units',
                organisationUnits: ['ou1', 'ou2'],
            })
        })
    })

    describe('returns ProgramMetadataItem as-is', () => {
        it('returns the input unchanged', () => {
            const input: AnyMetadataItemInput = {
                id: 'prog1',
                name: 'Program 1',
                programType: 'WITH_REGISTRATION',
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toBe(input)
        })
    })

    describe('returns ProgramStageMetadataItem as-is', () => {
        it('returns the input unchanged', () => {
            const input: AnyMetadataItemInput = {
                id: 'stage1',
                name: 'Stage 1',
                repeatable: false,
                hideDueDate: true,
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toBe(input)
        })
    })

    describe('returns OptionSetMetadataItem as-is', () => {
        it('returns the input unchanged', () => {
            const input: AnyMetadataItemInput = {
                id: 'optset1',
                name: 'Option Set 1',
                options: [],
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toBe(input)
        })
    })

    describe('returns LegendSetMetadataItem as-is', () => {
        it('returns the input unchanged', () => {
            const input: AnyMetadataItemInput = {
                id: 'legend1',
                name: 'Legend Set 1',
                legends: [],
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toBe(input)
        })
    })

    describe('returns OrganisationUnitMetadataItem as-is', () => {
        it('returns the input unchanged', () => {
            const input: AnyMetadataItemInput = {
                id: 'ou1',
                name: 'Org Unit 1',
                path: '/root/ou1',
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toBe(input)
        })
    })

    describe('returns UserOrgUnitMetadataItem as-is', () => {
        it('returns the input unchanged', () => {
            const input: AnyMetadataItemInput = {
                id: 'USER_ORGUNIT',
                name: 'User Org Units',
                organisationUnits: [],
            }

            const result = normalizeMetadataInputItem(input, mockMetadataMap)

            expect(result).toBe(input)
        })
    })

    describe('throws error for unknown input type', () => {
        it('throws an error when input does not match any type', () => {
            const input = {
                unknownKey1: 'value 1',
                unknownKey2: 'value 2',
            } as AnyMetadataItemInput

            expect(() => {
                normalizeMetadataInputItem(input, mockMetadataMap)
            }).toThrow('Unknown metadata input type')
        })
    })
})
