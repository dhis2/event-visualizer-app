import type { Program, ProgramStage } from '@types'
import { describe, expect, it } from 'vitest'
import { getEventFixedDimensions } from './get-event-fixed-dimensions'

const program = {
    id: 'program-id',
    name: 'Program',
} as Program

const programStage = {
    id: 'stage-id',
    name: 'Stage',
    program: { id: 'program-id' },
} as ProgramStage

describe('getEventFixedDimensions', () => {
    it('adds program and program stage context to fixed event dimensions', () => {
        const dimensions = getEventFixedDimensions(program, programStage)

        expect(dimensions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'stage-id.ou',
                    dimensionId: 'ou',
                    programId: 'program-id',
                    programStageId: 'stage-id',
                }),
                expect.objectContaining({
                    id: 'stage-id.eventDate',
                    dimensionId: 'eventDate',
                    programId: 'program-id',
                    programStageId: 'stage-id',
                }),
                expect.objectContaining({
                    id: 'stage-id.scheduledDate',
                    dimensionId: 'scheduledDate',
                    programId: 'program-id',
                    programStageId: 'stage-id',
                }),
                expect.objectContaining({
                    id: 'stage-id.eventStatus',
                    dimensionId: 'eventStatus',
                    programId: 'program-id',
                    programStageId: 'stage-id',
                }),
            ])
        )
    })
})
