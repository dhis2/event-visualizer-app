import { getTetId } from '@modules/visualization/tracked-entity-type'
import type { CurrentVisualization, Program } from '@types'
import { describe, expect, it } from 'vitest'

const trackerProgram = {
    id: 'trackerProgram1',
    trackedEntityType: { id: 'person1', name: 'Person' },
} as Program
const eventProgram = { id: 'eventProgram1' } as Program

describe('getTetId', () => {
    it("uses a tracked entity visualization's own tracked entity type", () => {
        expect(
            getTetId({
                trackedEntityType: { id: 'household1', name: 'Household' },
                programDimensions: [trackerProgram],
            } as CurrentVisualization)
        ).toBe('household1')
    })

    it('uses the tracker program of a visualization without one', () => {
        expect(
            getTetId({
                programDimensions: [trackerProgram],
            } as CurrentVisualization)
        ).toBe('person1')
    })

    it('has none for an event program', () => {
        expect(
            getTetId({
                programDimensions: [eventProgram],
            } as CurrentVisualization)
        ).toBeUndefined()
    })
})
