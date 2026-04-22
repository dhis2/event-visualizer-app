import { toCurrentVis } from '@modules/visualization'
import { currentVisSlice } from '@store/current-vis-slice'
import { savedVisSlice } from '@store/saved-vis-slice'
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import type {
    CurrentVisualization,
    EmptyVisualization,
    Program,
    SavedVisualization,
} from '@types'
import { describe, it, expect, vi } from 'vitest'
import { useToolbarActions } from '../use-toolbar-actions'

vi.mock('@dhis2/app-runtime', () => ({
    useAlert: vi.fn(() => ({ show: vi.fn() })),
}))

const makeProgram = (id: string): Program =>
    ({ id, name: `Program ${id}` }) as Program

const makeSavedVis = (
    overrides: Partial<SavedVisualization> = {}
): SavedVisualization =>
    ({
        id: 'vis-1',
        name: 'Test vis',
        displayName: 'Test vis',
        type: 'LINE_LIST',
        outputType: 'EVENT',
        columns: [],
        rows: [],
        filters: [],
        programDimensions: [makeProgram('prog-1')],
        access: {
            read: true,
            update: true,
            delete: true,
            manage: true,
        },
        legacy: false,
        ...overrides,
    }) as unknown as SavedVisualization

const makePersistableEventCurrentVis = (
    overrides: Partial<CurrentVisualization> = {}
): CurrentVisualization =>
    ({
        type: 'LINE_LIST',
        outputType: 'EVENT',
        columns: [],
        rows: [],
        filters: [],
        programDimensions: [makeProgram('prog-1')],
        ...overrides,
    }) as unknown as CurrentVisualization

const makeUnpersistableEventCurrentVis = (): CurrentVisualization =>
    ({
        type: 'LINE_LIST',
        outputType: 'EVENT',
        columns: [],
        rows: [],
        filters: [],
        // no programDimensions
    }) as unknown as CurrentVisualization

const makePersistableTeiCurrentVis = (
    overrides: Partial<CurrentVisualization> = {}
): CurrentVisualization =>
    ({
        type: 'LINE_LIST',
        outputType: 'TRACKED_ENTITY_INSTANCE',
        columns: [],
        rows: [],
        filters: [],
        trackedEntityType: { id: 'tei-1', name: 'Person' },
        ...overrides,
    }) as unknown as CurrentVisualization

const renderToolbarActions = ({
    currentVis,
    savedVis,
}: {
    currentVis: CurrentVisualization | EmptyVisualization
    savedVis: SavedVisualization | EmptyVisualization
}) => {
    const store = setupStore(
        {
            [currentVisSlice.name]: currentVisSlice.reducer,
            [savedVisSlice.name]: savedVisSlice.reducer,
        },
        {
            [currentVisSlice.name]: currentVis,
            [savedVisSlice.name]: savedVis,
        }
    )
    return renderHookWithReduxStoreProvider(() => useToolbarActions(), store)
}

describe('useToolbarActions', () => {
    describe('isSaveEnabled', () => {
        it('is false when both visualizations are EMPTY', () => {
            const { result } = renderToolbarActions({
                currentVis: {},
                savedVis: {},
            })
            expect(result.current.isSaveEnabled).toBe(false)
        })

        it('is true for a brand-new persistable vis (UNSAVED)', () => {
            const { result } = renderToolbarActions({
                currentVis: makePersistableEventCurrentVis(),
                savedVis: {},
            })
            expect(result.current.isSaveEnabled).toBe(true)
        })

        it('is false for a brand-new vis without a program (UNSAVED, not persistable)', () => {
            const { result } = renderToolbarActions({
                currentVis: makeUnpersistableEventCurrentVis(),
                savedVis: {},
            })
            expect(result.current.isSaveEnabled).toBe(false)
        })

        it('is false when currentVis equals savedVis (SAVED, no changes)', () => {
            const savedVis = makeSavedVis()
            const { result } = renderToolbarActions({
                currentVis: toCurrentVis(savedVis),
                savedVis,
            })
            expect(result.current.isSaveEnabled).toBe(false)
        })

        it('is true when DIRTY with update access and non-legacy saved vis', () => {
            const savedVis = makeSavedVis()
            const currentVis: CurrentVisualization = {
                ...toCurrentVis(savedVis),
                title: 'edited',
            }
            const { result } = renderToolbarActions({ currentVis, savedVis })
            expect(result.current.isSaveEnabled).toBe(true)
        })

        it('is false when DIRTY but saved vis lacks update access', () => {
            const savedVis = makeSavedVis({
                access: {
                    read: true,
                    update: false,
                    delete: false,
                    manage: false,
                },
            } as Partial<SavedVisualization>)
            const currentVis: CurrentVisualization = {
                ...toCurrentVis(savedVis),
                title: 'edited',
            }
            const { result } = renderToolbarActions({ currentVis, savedVis })
            expect(result.current.isSaveEnabled).toBe(false)
        })

        it('is false when DIRTY but saved vis is legacy', () => {
            const savedVis = makeSavedVis({ legacy: true })
            const currentVis: CurrentVisualization = {
                ...toCurrentVis(savedVis),
                title: 'edited',
            }
            const { result } = renderToolbarActions({ currentVis, savedVis })
            expect(result.current.isSaveEnabled).toBe(false)
        })

        it('is true for a brand-new persistable TEI vis', () => {
            const { result } = renderToolbarActions({
                currentVis: makePersistableTeiCurrentVis(),
                savedVis: {},
            })
            expect(result.current.isSaveEnabled).toBe(true)
        })

        it('is false for a TEI vis without trackedEntityType (not persistable)', () => {
            const { result } = renderToolbarActions({
                currentVis: {
                    type: 'LINE_LIST',
                    outputType: 'TRACKED_ENTITY_INSTANCE',
                    columns: [],
                    rows: [],
                    filters: [],
                } as unknown as CurrentVisualization,
                savedVis: {},
            })
            expect(result.current.isSaveEnabled).toBe(false)
        })
    })

    describe('isSaveAsEnabled', () => {
        it('is false when both visualizations are EMPTY', () => {
            const { result } = renderToolbarActions({
                currentVis: {},
                savedVis: {},
            })
            expect(result.current.isSaveAsEnabled).toBe(false)
        })

        it('is false for a brand-new persistable vis (UNSAVED — nothing to copy)', () => {
            const { result } = renderToolbarActions({
                currentVis: makePersistableEventCurrentVis(),
                savedVis: {},
            })
            expect(result.current.isSaveAsEnabled).toBe(false)
        })

        it('is true when SAVED (unchanged copy of saved vis)', () => {
            const savedVis = makeSavedVis()
            const { result } = renderToolbarActions({
                currentVis: toCurrentVis(savedVis),
                savedVis,
            })
            expect(result.current.isSaveAsEnabled).toBe(true)
        })

        it('is true when DIRTY with update access and non-legacy saved vis', () => {
            const savedVis = makeSavedVis()
            const currentVis: CurrentVisualization = {
                ...toCurrentVis(savedVis),
                title: 'edited',
            }
            const { result } = renderToolbarActions({ currentVis, savedVis })
            expect(result.current.isSaveAsEnabled).toBe(true)
        })

        it('is true when DIRTY even without update access', () => {
            const savedVis = makeSavedVis({
                access: {
                    read: true,
                    update: false,
                    delete: false,
                    manage: false,
                },
            } as Partial<SavedVisualization>)
            const currentVis: CurrentVisualization = {
                ...toCurrentVis(savedVis),
                title: 'edited',
            }
            const { result } = renderToolbarActions({ currentVis, savedVis })
            expect(result.current.isSaveAsEnabled).toBe(true)
        })

        it('is true when DIRTY and saved vis is legacy', () => {
            const savedVis = makeSavedVis({ legacy: true })
            const currentVis: CurrentVisualization = {
                ...toCurrentVis(savedVis),
                title: 'edited',
            }
            const { result } = renderToolbarActions({ currentVis, savedVis })
            expect(result.current.isSaveAsEnabled).toBe(true)
        })

        it('is false when currentVis is not persistable even if savedVis is populated', () => {
            const savedVis = makeSavedVis()
            const { result } = renderToolbarActions({
                currentVis: makeUnpersistableEventCurrentVis(),
                savedVis,
            })
            expect(result.current.isSaveAsEnabled).toBe(false)
        })

        it('is true for a persistable TEI currentVis with a saved vis to copy', () => {
            const savedVis = makeSavedVis({
                outputType: 'TRACKED_ENTITY_INSTANCE',
                trackedEntityType: { id: 'tei-1', name: 'Person' },
                programDimensions: undefined,
            } as Partial<SavedVisualization>)
            const currentVis: CurrentVisualization = {
                ...toCurrentVis(savedVis),
                title: 'edited',
            }
            const { result } = renderToolbarActions({ currentVis, savedVis })
            expect(result.current.isSaveAsEnabled).toBe(true)
        })
    })
})
