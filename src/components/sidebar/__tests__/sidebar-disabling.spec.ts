import type { DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import {
    getDimensionBlockReason,
    getDimensionLayoutBlockedMessage,
} from '../sidebar-disabling'

const makeDim = (
    overrides: Partial<DimensionMetadataItem>
): DimensionMetadataItem => ({
    id: overrides.id ?? 'fallback.id',
    dimensionId: overrides.dimensionId ?? 'fallback',
    name: overrides.name ?? 'Fallback',
    dimensionType: overrides.dimensionType ?? 'DATA_ELEMENT',
    ...overrides,
})

type BlockedArgs = Parameters<typeof getDimensionLayoutBlockedMessage>[0]

const getMessage = (
    args: Partial<BlockedArgs> & Pick<BlockedArgs, 'dimension'>
): string | null =>
    getDimensionLayoutBlockedMessage({
        visualizationType: 'PIVOT_TABLE',
        customValueId: null,
        layoutTetId: null,
        dimensionTetId: null,
        crossTetMessage: '',
        ...args,
    })

type ReasonArgs = Parameters<typeof getDimensionBlockReason>[0]

const getReason = (args: Partial<ReasonArgs> & Pick<ReasonArgs, 'dimension'>) =>
    getDimensionBlockReason({
        visualizationType: 'PIVOT_TABLE',
        customValueId: null,
        layoutTetId: null,
        dimensionTetId: null,
        ...args,
    })

describe('getDimensionBlockReason', () => {
    it('returns customValue when the dim is the custom value', () => {
        expect(
            getReason({ dimension: makeDim({ id: 'x' }), customValueId: 'x' })
        ).toBe('customValue')
    })

    it('returns visType for a program indicator outside line list', () => {
        expect(
            getReason({
                dimension: makeDim({ dimensionType: 'PROGRAM_INDICATOR' }),
            })
        ).toBe('visType')
    })

    it('returns crossTet when the dim TET differs from the layout TET', () => {
        expect(
            getReason({
                dimension: makeDim({}),
                dimensionTetId: 'tetB',
                layoutTetId: 'tetA',
            })
        ).toBe('crossTet')
    })

    it('returns null when nothing applies', () => {
        expect(
            getReason({
                dimension: makeDim({}),
                visualizationType: 'LINE_LIST',
            })
        ).toBeNull()
    })

    it('prefers customValue, then visType, over crossTet', () => {
        expect(
            getReason({
                dimension: makeDim({
                    id: 'pi',
                    dimensionType: 'PROGRAM_INDICATOR',
                }),
                customValueId: 'pi',
                dimensionTetId: 'tetB',
                layoutTetId: 'tetA',
            })
        ).toBe('customValue')
        expect(
            getReason({
                dimension: makeDim({ dimensionType: 'PROGRAM_INDICATOR' }),
                dimensionTetId: 'tetB',
                layoutTetId: 'tetA',
            })
        ).toBe('visType')
    })
})

describe('getDimensionLayoutBlockedMessage — custom-value rule (Case C)', () => {
    it('disables the dim whose compound id matches the custom value id', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'stage1.de1' }),
                customValueId: 'stage1.de1',
            })
        ).toBe('Already used as custom value.')
    })

    it('does not disable a different stage-instance of the same DE', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'stageB.de1' }),
                customValueId: 'stageA.de1',
            })
        ).toBeNull()
    })

    it('leaves non-matching dims enabled', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'stage1.de2' }),
                customValueId: 'stage1.de1',
            })
        ).toBeNull()
    })

    it('does not fire when no custom value is set', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'stage1.de1' }),
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
            getMessage({
                dimension: registrationOuDim,
                visualizationType: 'PIVOT_TABLE',
            })
        ).toBe('Cannot be used in a Pivot table.')
    })

    it('does not disable the TET registration OU item when vis is LINE_LIST', () => {
        expect(
            getMessage({
                dimension: registrationOuDim,
                visualizationType: 'LINE_LIST',
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
            getMessage({
                dimension: programEnrollmentOu,
                visualizationType: 'PIVOT_TABLE',
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
            getMessage({
                dimension: stageOu,
                visualizationType: 'PIVOT_TABLE',
            })
        ).toBeNull()
    })
})

describe('getDimensionLayoutBlockedMessage — cross-TET rule (Case D)', () => {
    const crossTetMessage =
        'Person dimensions cannot be combined with Malaria case dimensions already in the layout.'

    it('blocks a dim whose TET differs from the layout TET', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'tetB.attr' }),
                dimensionTetId: 'tetB',
                layoutTetId: 'tetA',
                crossTetMessage,
            })
        ).toBe(crossTetMessage)
    })

    it('does not block when the dim TET matches the layout TET', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'tetA.attr' }),
                dimensionTetId: 'tetA',
                layoutTetId: 'tetA',
                crossTetMessage,
            })
        ).toBeNull()
    })

    it('does not block a generic dim (no TET) even when the layout has a TET', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'pe' }),
                dimensionTetId: null,
                layoutTetId: 'tetA',
                crossTetMessage,
            })
        ).toBeNull()
    })

    it('does not block when the layout has no TET yet', () => {
        expect(
            getMessage({
                dimension: makeDim({ id: 'tetB.attr' }),
                dimensionTetId: 'tetB',
                layoutTetId: null,
                crossTetMessage,
            })
        ).toBeNull()
    })
})

describe('getDimensionLayoutBlockedMessage — rule precedence', () => {
    const crossTetMessage = 'cross-tet message'

    it('returns the custom-value message when it could fire alongside cross-TET', () => {
        expect(
            getMessage({
                dimension: makeDim({
                    id: 'tetA.enrollmentOu',
                    dimensionId: 'enrollmentOu',
                    dimensionType: 'ORGANISATION_UNIT',
                    trackedEntityTypeId: 'tetA',
                }),
                customValueId: 'tetA.enrollmentOu',
                dimensionTetId: 'tetB',
                layoutTetId: 'tetA',
                crossTetMessage,
            })
        ).toContain('custom value')
    })

    it('returns the vis-type message when it could fire alongside cross-TET', () => {
        expect(
            getMessage({
                dimension: makeDim({
                    id: 'pi1',
                    dimensionType: 'PROGRAM_INDICATOR',
                }),
                visualizationType: 'PIVOT_TABLE',
                dimensionTetId: 'tetB',
                layoutTetId: 'tetA',
                crossTetMessage,
            })
        ).toBe('Cannot be used in a Pivot table.')
    })
})
