import { describe, it, expect } from 'vitest'
import { getFullDimensionId, getDimensionIdParts } from '../dimension'

const outputType = 'EVENT'
describe('getFullDimensionId', () => {
    it('returns correct result for: dimensionId', () => {
        const dimensionId = 'did'

        expect(getFullDimensionId({ dimensionId, outputType })).toEqual('did')
    })
    it('returns correct result for: programStageId + dimensionId', () => {
        const dimensionId = 'did'
        const programStageId = 'sid'

        expect(
            getFullDimensionId({ dimensionId, programStageId, outputType })
        ).toEqual('sid.did')
    })
    it('returns correct result for: programId + programStageId + dimensionId', () => {
        const dimensionId = 'did'
        const programStageId = 'sid'
        const programId = 'pid'

        expect(
            getFullDimensionId({
                dimensionId,
                programStageId,
                programId,
                outputType,
            })
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
                outputType: 'TRACKED_ENTITY_INSTANCE',
            })
        ).toEqual('pid.sid.did')
    })
})

describe('getDimensionIdParts', () => {
    it('returns correct result for: dimensionId', () => {
        const id = 'did'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toBeFalsy()
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for: programStageId + dimensionId', () => {
        const id = 'sid.did'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for: programStageId + dimensionId + repetitionIndex', () => {
        const id = 'sid[3].did'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Event: programStageId + dimensionId + repetitionIndex', () => {
        const id = 'sid[3].did'
        const outputType = 'EVENT'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Enrollment: programStageId + dimensionId + repetitionIndex', () => {
        const id = 'sid[3].did'
        const outputType = 'ENROLLMENT'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toBeUndefined()
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for: programId + programStageId + dimensionId', () => {
        const id = 'pid.sid.did'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for: programId + programStageId + dimensionId + repetitionIndex', () => {
        const id = 'pid.sid[3].did'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId', () => {
        const id = 'pid.sid.did'
        const outputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId + repetitionIndex', () => {
        const id = 'pid.sid[3].did'
        const outputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toEqual('sid')
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toEqual('3')
    })
    it('returns correct result for Tracked Entity: programId + dimensionId', () => {
        const id = 'pid.did'
        const outputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, outputType })

        expect(output.dimensionId).toEqual('did')
        expect(output.programStageId).toBeFalsy()
        expect(output.programId).toEqual('pid')
        expect(output.repetitionIndex).toBeUndefined()
    })
    it('returns correct result for Tracked Entity: dimensionId', () => {
        const id = 'did'
        const outputType = 'TRACKED_ENTITY_INSTANCE'
        const output = getDimensionIdParts({ id, outputType })

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
                outputType,
            }),
            outputType,
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
                outputType,
            }),
            outputType,
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
                outputType,
            }),
            outputType,
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
                outputType: 'TRACKED_ENTITY_INSTANCE',
            }),
            outputType: 'TRACKED_ENTITY_INSTANCE',
        })

        expect(dimensionId).toEqual(inputDimensionId)
        expect(programStageId).toEqual(inputProgramStageId)
        expect(programId).toEqual(inputProgramId)
    })
})

describe('getDimensionIdParts + getFullDimensionId', () => {
    it('returns correct result for: dimensionId', () => {
        const inputId = 'did'

        const { dimensionId } = getDimensionIdParts({ id: inputId, outputType })

        const outputId = getFullDimensionId({
            dimensionId,
            outputType,
        })

        expect(outputId).toEqual(inputId)
    })

    it('returns correct result for: programStageId + dimensionId', () => {
        const inputId = 'sid.did'

        const { dimensionId, programStageId } = getDimensionIdParts({
            id: inputId,
            outputType,
        })

        const outputId = getFullDimensionId({
            dimensionId,
            programStageId,
            outputType,
        })

        expect(outputId).toEqual(inputId)
    })

    it('returns correct result for: programId + programStageId + dimensionId', () => {
        const inputId = 'sid.did'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: inputId,
            outputType,
        })

        const outputId = getFullDimensionId({
            dimensionId,
            programStageId,
            programId,
            outputType,
        })

        expect(outputId).toEqual(inputId)
    })

    it('returns correct result for Tracked Entity: programId + programStageId + dimensionId', () => {
        const inputId = 'pid.sid.did'

        const { dimensionId, programStageId, programId } = getDimensionIdParts({
            id: inputId,
            outputType: 'TRACKED_ENTITY_INSTANCE',
        })

        const outputId = getFullDimensionId({
            dimensionId,
            programStageId,
            programId,
            outputType: 'TRACKED_ENTITY_INSTANCE',
        })

        expect(outputId).toEqual(inputId)
    })
})
