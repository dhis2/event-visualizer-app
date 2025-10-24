import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getSaveableVisualization } from '../visualization'
import * as optionsModule from '@modules/options'
import type { CurrentVisualization } from '@types'

type OptionsReturn = Record<string, { persisted: boolean }>
const mockOptions: OptionsReturn = {
    keepOption: { persisted: true },
    tempOption: { persisted: false },
}

beforeEach(() => {
    const mod = optionsModule as unknown as {
        getAllOptions: () => OptionsReturn
    }
    vi.spyOn(mod, 'getAllOptions').mockReturnValue(mockOptions)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('getSaveableVisualization', () => {
    it('removes non-persisted options from the saved visualization', () => {
        const vis = {
            keepOption: 'keep-me',
            tempOption: 'remove-me',
            columns: [],
            filters: [],
        } as unknown as CurrentVisualization

        const saved = getSaveableVisualization(vis)

        // persisted option should still be present
        expect((saved as Record<string, unknown>)['keepOption']).toBe('keep-me')
        // non-persisted option should have been removed
        expect('tempOption' in (saved as Record<string, unknown>)).toBe(false)
    })

    it('strips dimensionType and valueType from columns and filters', () => {
        const vis = {
            columns: [
                {
                    dimension: 'a',
                    dimensionType: 'SOME_TYPE',
                    valueType: 'TEXT',
                },
            ],
            filters: [
                {
                    dimension: 'b',
                    dimensionType: 'OTHER',
                    valueType: 'NUMBER',
                },
            ],
        } as unknown as CurrentVisualization

        const saved = getSaveableVisualization(vis)

        expect(saved.columns).toBeDefined()
        const col0 = (saved.columns as Array<Record<string, unknown>>)[0]
        expect(col0.dimension).toBe('a')
        expect('dimensionType' in col0).toBe(false)
        expect('valueType' in col0).toBe(false)

        expect(saved.filters).toBeDefined()
        const filt0 = (saved.filters as Array<Record<string, unknown>>)[0]
        expect(filt0.dimension).toBe('b')
        expect('dimensionType' in filt0).toBe(false)
        expect('valueType' in filt0).toBe(false)
    })

    it('removes programStage when id is not provided', () => {
        const vis = {
            programStage: {},
            columns: [],
            filters: [],
        } as unknown as CurrentVisualization

        const saved = getSaveableVisualization(vis)
        expect(saved.programStage).toBeUndefined()
    })

    it('keeps programStage when id is present', () => {
        const vis = {
            programStage: { id: 'stage-1', name: 'Stage 1' },
            columns: [],
            filters: [],
        } as unknown as CurrentVisualization

        const saved = getSaveableVisualization(vis)
        expect(saved.programStage).toEqual({ id: 'stage-1', name: 'Stage 1' })
    })

    it('removes legacy property before saving', () => {
        const vis = {
            legacy: true,
            columns: [],
            filters: [],
        } as unknown as CurrentVisualization

        const saved = getSaveableVisualization(vis)
        expect('legacy' in (saved as Record<string, unknown>)).toBe(false)
    })

    it('uses only the first sorting item and uppercases the direction', () => {
        const vis = {
            sorting: [
                { dimension: 'someDim', direction: 'desc' },
                { dimension: 'other', direction: 'asc' },
            ],
            columns: [],
            filters: [],
        } as unknown as CurrentVisualization

        const saved = getSaveableVisualization(vis)
        expect(saved.sorting).toBeDefined()
        expect(saved.sorting as Array<Record<string, unknown>>).toHaveLength(1)
        const s0 = (saved.sorting as Array<Record<string, unknown>>)[0]
        expect(s0.dimension).toBe('someDim')
        expect(s0.direction).toBe('DESC')
    })

    it('sets sorting to undefined when sorting is not provided or empty', () => {
        const vis1 = {
            columns: [],
            filters: [],
        } as unknown as CurrentVisualization
        const vis2 = {
            sorting: [],
            columns: [],
            filters: [],
        } as unknown as CurrentVisualization

        const saved1 = getSaveableVisualization(vis1)
        const saved2 = getSaveableVisualization(vis2)

        expect(saved1.sorting).toBeUndefined()
        expect(saved2.sorting).toBeUndefined()
    })
})
