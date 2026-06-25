import type { DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import { getDimensionLayoutBlockedMessage } from '../sidebar-disabling'

const makeDim = (
    overrides: Partial<DimensionMetadataItem>
): DimensionMetadataItem => ({
    id: overrides.id ?? 'fallback.id',
    dimensionId: overrides.dimensionId ?? 'fallback',
    name: overrides.name ?? 'Fallback',
    dimensionType: overrides.dimensionType ?? 'DATA_ELEMENT',
    ...overrides,
})

describe('getDimensionLayoutBlockedMessage — custom-value rule (Case C)', () => {
    it('disables the dim whose compound id matches the custom value id', () => {
        const dim = makeDim({ id: 'stage1.de1' })
        expect(
            getDimensionLayoutBlockedMessage({
                dimension: dim,
                visualizationType: 'PIVOT_TABLE',
                customValueId: 'stage1.de1',
            })
        ).toBe('Already used as custom value.')
    })

    it('does not disable a different stage-instance of the same DE', () => {
        const dimStageB = makeDim({ id: 'stageB.de1' })
        expect(
            getDimensionLayoutBlockedMessage({
                dimension: dimStageB,
                visualizationType: 'PIVOT_TABLE',
                customValueId: 'stageA.de1',
            })
        ).toBeNull()
    })

    it('leaves non-matching dims enabled', () => {
        const dim = makeDim({ id: 'stage1.de2' })
        expect(
            getDimensionLayoutBlockedMessage({
                dimension: dim,
                visualizationType: 'PIVOT_TABLE',
                customValueId: 'stage1.de1',
            })
        ).toBeNull()
    })

    it('does not fire when no custom value is set', () => {
        const dim = makeDim({ id: 'stage1.de1' })
        expect(
            getDimensionLayoutBlockedMessage({
                dimension: dim,
                visualizationType: 'PIVOT_TABLE',
                customValueId: null,
            })
        ).toBeNull()
    })
})

describe('getDimensionLayoutBlockedMessage — registration OU rule (Case B)', () => {
    const registrationOuDim = makeDim({
        id: 'tetA.enrollmentOu',
        dimensionId: 'enrollmentOu',
        dimensionType: 'ORGANISATION_UNIT',
        trackedEntityTypeId: 'tetA',
    })

    it('blocks the TET registration OU item when vis is PIVOT_TABLE', () => {
        expect(
            getDimensionLayoutBlockedMessage({
                dimension: registrationOuDim,
                visualizationType: 'PIVOT_TABLE',
                customValueId: null,
            })
        ).toBe('Not supported in a Pivot table.')
    })

    it('does not disable the TET registration OU item when vis is LINE_LIST', () => {
        expect(
            getDimensionLayoutBlockedMessage({
                dimension: registrationOuDim,
                visualizationType: 'LINE_LIST',
                customValueId: null,
            })
        ).toBeNull()
    })

    it('does not fire for program-scope enrollment OU (no trackedEntityTypeId)', () => {
        const programEnrollmentOu = makeDim({
            id: 'progA.enrollmentOu',
            dimensionId: 'enrollmentOu',
            dimensionType: 'ORGANISATION_UNIT',
            programId: 'progA',
        })
        expect(
            getDimensionLayoutBlockedMessage({
                dimension: programEnrollmentOu,
                visualizationType: 'PIVOT_TABLE',
                customValueId: null,
            })
        ).toBeNull()
    })

    it('does not fire for stage event OU (dimensionId is "ou", not "enrollmentOu")', () => {
        const stageOu = makeDim({
            id: 'stage1.ou',
            dimensionId: 'ou',
            dimensionType: 'ORGANISATION_UNIT',
            programId: 'progA',
            programStageId: 'stage1',
        })
        expect(
            getDimensionLayoutBlockedMessage({
                dimension: stageOu,
                visualizationType: 'PIVOT_TABLE',
                customValueId: null,
            })
        ).toBeNull()
    })
})

describe('getDimensionLayoutBlockedMessage — both rules', () => {
    it('returns the custom-value message when both rules could fire (TET registration OU is the custom value)', () => {
        const dim = makeDim({
            id: 'tetA.enrollmentOu',
            dimensionId: 'enrollmentOu',
            dimensionType: 'ORGANISATION_UNIT',
            trackedEntityTypeId: 'tetA',
        })
        const result = getDimensionLayoutBlockedMessage({
            dimension: dim,
            visualizationType: 'PIVOT_TABLE',
            customValueId: 'tetA.enrollmentOu',
        })
        expect(result).toContain('custom value')
    })
})
