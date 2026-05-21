import type { DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import { getDimensionDisabledMessageByLayout } from '../sidebar-disabling'

const makeDim = (
    overrides: Partial<DimensionMetadataItem>
): DimensionMetadataItem =>
    ({
        id: overrides.id ?? 'fallback.id',
        dimensionId: overrides.dimensionId ?? 'fallback',
        name: overrides.name ?? 'Fallback',
        dimensionType: overrides.dimensionType ?? 'DATA_ELEMENT',
        ...overrides,
    }) as DimensionMetadataItem

describe('getDimensionDisabledMessageByLayout — custom-value rule (Case C)', () => {
    it('disables the dim whose compound id matches the custom value id', () => {
        const dim = makeDim({ id: 'stage1.de1' })
        expect(
            getDimensionDisabledMessageByLayout({
                dimension: dim,
                visualizationType: 'PIVOT_TABLE',
                customValueId: 'stage1.de1',
            })
        ).toBe(
            'This dimension is used as the custom value. Remove the custom value to use it in the layout.'
        )
    })

    it('does not disable a different stage-instance of the same DE', () => {
        const dimStageB = makeDim({ id: 'stageB.de1' })
        expect(
            getDimensionDisabledMessageByLayout({
                dimension: dimStageB,
                visualizationType: 'PIVOT_TABLE',
                customValueId: 'stageA.de1',
            })
        ).toBeNull()
    })

    it('leaves non-matching dims enabled', () => {
        const dim = makeDim({ id: 'stage1.de2' })
        expect(
            getDimensionDisabledMessageByLayout({
                dimension: dim,
                visualizationType: 'PIVOT_TABLE',
                customValueId: 'stage1.de1',
            })
        ).toBeNull()
    })

    it('does not fire when no custom value is set', () => {
        const dim = makeDim({ id: 'stage1.de1' })
        expect(
            getDimensionDisabledMessageByLayout({
                dimension: dim,
                visualizationType: 'PIVOT_TABLE',
                customValueId: null,
            })
        ).toBeNull()
    })
})

describe('getDimensionDisabledMessageByLayout — registration OU rule (Case B)', () => {
    const registrationOuDim = makeDim({
        id: 'tetA.enrollmentOu',
        dimensionId: 'enrollmentOu',
        dimensionType: 'ORGANISATION_UNIT',
        trackedEntityTypeId: 'tetA',
    })

    it('disables the TET registration OU item when vis is PIVOT_TABLE', () => {
        expect(
            getDimensionDisabledMessageByLayout({
                dimension: registrationOuDim,
                visualizationType: 'PIVOT_TABLE',
                customValueId: null,
            })
        ).toBe('Not valid with Pivot table')
    })

    it('does not disable the TET registration OU item when vis is LINE_LIST', () => {
        expect(
            getDimensionDisabledMessageByLayout({
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
            getDimensionDisabledMessageByLayout({
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
            getDimensionDisabledMessageByLayout({
                dimension: stageOu,
                visualizationType: 'PIVOT_TABLE',
                customValueId: null,
            })
        ).toBeNull()
    })
})

describe('getDimensionDisabledMessageByLayout — both rules', () => {
    it('returns the custom-value message when both rules could fire (TET registration OU is the custom value)', () => {
        const dim = makeDim({
            id: 'tetA.enrollmentOu',
            dimensionId: 'enrollmentOu',
            dimensionType: 'ORGANISATION_UNIT',
            trackedEntityTypeId: 'tetA',
        })
        const result = getDimensionDisabledMessageByLayout({
            dimension: dim,
            visualizationType: 'PIVOT_TABLE',
            customValueId: 'tetA.enrollmentOu',
        })
        expect(result).toContain('custom value')
    })
})
