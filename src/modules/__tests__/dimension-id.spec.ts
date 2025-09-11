import { describe, it, expect } from 'vitest'
import { getFullDimensionId, getDimensionIdParts } from '../dimension-id'

describe('getFullDimensionId', () => {
    it('returns correct result for: dimensionId', () => {
        const dimensionId = 'did'

        expect(getFullDimensionId({ dimensionId })).toEqual('did')
    })
    it('returns correct result for: programStageId + dimensionId', () => {
        const dimensionId = 'did'
        const programStageId = 'sid'

        expect(getFullDimensionId({ dimensionId, programStageId })).toEqual(
            'sid.did'
        )
    })
    it('returns correct result for: programId + programStageId + dimensionId', () => {
        const dimensionId = 'did'
        const programStageId = 'sid'
        const programId = 'pid'

        expect(
            getFullDimensionId({ dimensionId, programStageId, programId })
        ).toEqual('sid.did')
    })
    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId', () => {
        const dimensionId = 'did'
        const programStageId = 'sid'
        const programId = 'pid'

        expect(
            getFullDimensionId({
                dimensionId,
                programStageId,
                programId,
                inputType: 'TRACKED_ENTITY_INSTANCE',
            })
        ).toEqual('pid.sid.did')
    })
})

describe('getDimensionIdParts', () => {
    it('returns correct result for: null', () => {
        const output = getDimensionIdParts({})

        expect(output.dimensionId).toEqual('')
        expect(output.programStageId).toEqual('')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for Tracked Entity: null', () => {
        const inputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id: null, inputType })

        expect(output.dimensionId).toEqual('')
        expect(output.programStageId).toEqual('')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for Tracked Entity: undefined', () => {
        const inputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id: undefined, inputType })

        expect(output.dimensionId).toEqual('')
        expect(output.programStageId).toEqual('')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for: dimensionId', () => {
        const id = 'did'
        const output = getDimensionIdParts({ id })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toBeFalsy()
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for: programStageId + dimensionId', () => {
        const id = 'sid.did'
        const output = getDimensionIdParts({ id })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for: programStageId + dimensionId + repetitionIndex', () => {
        const id = 'sid[3].did'
        const output = getDimensionIdParts({ id })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Event: programStageId + dimensionId + repetitionIndex', () => {
        const id = 'sid[3].did'
        const inputType = 'EVENT'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Enrollment: programStageId + dimensionId + repetitionIndex', () => {
        const id = 'sid[3].did'
        const inputType = 'ENROLLMENT'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for: programId + programStageId + dimensionId', () => {
        const id = 'pid.sid.did'
        const output = getDimensionIdParts({ id })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for: programId + programStageId + dimensionId + repetitionIndex', () => {
        const id = 'pid.sid[3].did'
        const output = getDimensionIdParts({ id })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId', () => {
        const id = 'pid.sid.did'
        const inputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId + repetitionIndex', () => {
        const id = 'pid.sid[3].did'
        const inputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Tracked Entity: programId + dimensionId', () => {
        const id = 'pid.did'
        const inputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toBeFalsy()
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for Tracked Entity: dimensionId', () => {
        const id = 'did'
        const inputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, inputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toBeFalsy()
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toBeUndefined()
    })
})

describe('getFullDimensionId + getDimensionIdParts', () => {
    it('returns correct result for: dimensionId', () => {
        const inputDimensionId = 'did'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: getFullDimensionId({
                dimensionId: inputDimensionId,
            }),
        })

        expect(dimensionId).toEqual(inputDimensionId)
        expect(programStageId).toBeFalsy()
        expect(programId).toBeUndefined()
    })

    it('returns correct result for: programStageId + dimensionId', () => {
        const inputDimensionId = 'did'
        const inputProgramStageId = 'sid'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: getFullDimensionId({
                dimensionId: inputDimensionId,
                programStageId: inputProgramStageId,
            }),
        })

        expect(dimensionId).toEqual(inputDimensionId)
        expect(programStageId).toEqual(inputProgramStageId)
        expect(programId).toBeUndefined()
    })

    it('returns correct result for: programId + programStageId + dimensionId', () => {
        const inputDimensionId = 'did'
        const inputProgramStageId = 'sid'
        const inputProgramId = 'pid'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: getFullDimensionId({
                dimensionId: inputDimensionId,
                programStageId: inputProgramStageId,
                programId: inputProgramId,
            }),
        })

        expect(dimensionId).toEqual(inputDimensionId)
        expect(programStageId).toEqual(inputProgramStageId)
        expect(programId).toBeUndefined()
    })

    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId', () => {
        const inputDimensionId = 'did'
        const inputProgramStageId = 'sid'
        const inputProgramId = 'pid'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: getFullDimensionId({
                dimensionId: inputDimensionId,
                programStageId: inputProgramStageId,
                programId: inputProgramId,
                inputType: 'TRACKED_ENTITY_INSTANCE',
            }),
            inputType: 'TRACKED_ENTITY_INSTANCE',
        })

        expect(dimensionId).toEqual(inputDimensionId)
        expect(programStageId).toEqual(inputProgramStageId)
        expect(programId).toEqual(inputProgramId)
    })
})

describe('getDimensionIdParts + getFullDimensionId', () => {
    it('returns correct result for: dimensionId', () => {
        const inputId = 'did'

        const { dimensionId } = getDimensionIdParts({ id: inputId })

        const outputId = getFullDimensionId({
            dimensionId,
        })

        expect(outputId).toEqual(inputId)
    })

    it('returns correct result for: programStageId + dimensionId', () => {
        const inputId = 'sid.did'

        const { dimensionId, programStageId } = getDimensionIdParts({
            id: inputId,
        })

        const outputId = getFullDimensionId({
            dimensionId,
            programStageId,
        })

        expect(outputId).toEqual(inputId)
    })

    it('returns correct result for: programId + programStageId + dimensionId', () => {
        const inputId = 'sid.did'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: inputId,
        })

        const outputId = getFullDimensionId({
            dimensionId,
            programStageId,
            programId,
        })

        expect(outputId).toEqual(inputId)
    })

    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId', () => {
        const inputId = 'pid.sid.did'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: inputId,
            inputType: 'TRACKED_ENTITY_INSTANCE',
        })

        const outputId = getFullDimensionId({
            dimensionId,
            programStageId,
            programId,
            inputType: 'TRACKED_ENTITY_INSTANCE',
        })

        expect(outputId).toEqual(inputId)
    })
})
