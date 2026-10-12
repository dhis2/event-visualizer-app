import { eventVisualizationsApi } from '@api/event-visualizations-api'
import { toCurrentVis } from '@modules/visualization/current-vis'
import { currentVisSlice } from '@store/current-vis-slice'
import { navigationSlice } from '@store/navigation-slice'
import { savedVisSlice } from '@store/saved-vis-slice'
import { renderHookWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { act } from '@testing-library/react'
import type {
    CurrentVisualization,
    EmptyVisualization,
    Program,
    SavedVisualization,
} from '@types'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useToolbarActions } from '../use-toolbar-actions'

vi.mock('@dhis2/app-runtime', () => ({
    useAlert: vi.fn(() => ({ show: vi.fn() })),
}))

vi.mock('@store/thunks', () => ({
    tLoadSavedVisualization: vi.fn(() => ({ type: 'test/noop' })),
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
            [navigationSlice.name]: navigationSlice.reducer,
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

    describe('onSave', () => {
        afterEach(() => {
            vi.restoreAllMocks()
        })

        const spyOnUpdateInitiate = () =>
            vi
                .spyOn(
                    eventVisualizationsApi.endpoints.updateVisualization,
                    'initiate'
                )
                .mockReturnValue((() =>
                    Promise.resolve({
                        data: 'vis-1',
                    })) as unknown as ReturnType<
                    typeof eventVisualizationsApi.endpoints.updateVisualization.initiate
                >)

        /* name and description live only on savedVis — currentVis never
         * carries them, so a save always takes them from savedVis. */
        it('saves with the name from savedVis', async () => {
            const savedVis = makeSavedVis({ name: 'My line list' })
            const currentVis = toCurrentVis(savedVis)
            const initiateSpy = spyOnUpdateInitiate()

            const { result } = renderToolbarActions({ currentVis, savedVis })

            await act(async () => {
                await result.current.onSave()
            })

            expect(initiateSpy).toHaveBeenCalledTimes(1)
            const payload = initiateSpy.mock.calls[0][0] as SavedVisualization
            expect(payload.name).toBe('My line list')
        })

        it('passes the description from savedVis', async () => {
            const savedVis = makeSavedVis({
                name: 'My line list',
                description: 'A helpful description',
            } as Partial<SavedVisualization>)
            const currentVis = toCurrentVis(savedVis)
            const initiateSpy = spyOnUpdateInitiate()

            const { result } = renderToolbarActions({ currentVis, savedVis })

            await act(async () => {
                await result.current.onSave()
            })

            const payload = initiateSpy.mock.calls[0][0] as SavedVisualization
            expect(payload.description).toBe('A helpful description')
        })
    })

    describe('onRename', () => {
        afterEach(() => {
            vi.restoreAllMocks()
        })

        const resolveWith = <T>(result: T) =>
            (() => Promise.resolve(result)) as unknown as never

        const spyOnFetch = (result: { data?: SavedVisualization }) =>
            vi
                .spyOn(
                    eventVisualizationsApi.endpoints.getVisualizationForUpdate,
                    'initiate'
                )
                .mockReturnValue(resolveWith(result))

        const spyOnRename = () =>
            vi
                .spyOn(
                    eventVisualizationsApi.endpoints.renameVisualization,
                    'initiate'
                )
                .mockReturnValue(
                    resolveWith({
                        data: { name: 'New name', displayName: 'New name' },
                    })
                )

        const spyOnCreate = () =>
            vi
                .spyOn(
                    eventVisualizationsApi.endpoints.createVisualization,
                    'initiate'
                )
                .mockReturnValue(resolveWith({ data: 'new-vis' }))

        const renderWithSavedVis = (savedVis: SavedVisualization) =>
            renderToolbarActions({
                currentVis: toCurrentVis(savedVis),
                savedVis,
            })

        it('renames a non-legacy visualization', async () => {
            const savedVis = makeSavedVis({ name: 'Old name' })
            spyOnFetch({ data: savedVis })
            const renameSpy = spyOnRename()

            const { result, store } = renderWithSavedVis(savedVis)

            await act(async () => {
                await result.current.onRename({ name: 'New name' })
            })

            expect(renameSpy).toHaveBeenCalledWith({
                visualization: savedVis,
                name: 'New name',
                description: undefined,
            })
            expect(store.getState().savedVis).toHaveProperty('name', 'New name')
            expect(result.current.pendingLegacyRename).toBeNull()
        })

        it('offers a save as new instead of renaming a legacy visualization', async () => {
            const savedVis = makeSavedVis({ name: 'Old name', legacy: true })
            spyOnFetch({ data: savedVis })
            const renameSpy = spyOnRename()

            const { result, store } = renderWithSavedVis(savedVis)

            await act(async () => {
                await result.current.onRename({ name: 'New name' })
            })

            expect(renameSpy).not.toHaveBeenCalled()
            expect(store.getState().savedVis).toHaveProperty('name', 'Old name')
            expect(result.current.pendingLegacyRename).toMatchObject({
                name: 'New name',
            })
        })

        it('checks the freshly fetched visualization for the legacy flag', async () => {
            const savedVis = makeSavedVis()
            spyOnFetch({ data: { ...savedVis, legacy: true } })
            const renameSpy = spyOnRename()

            const { result } = renderWithSavedVis(savedVis)

            await act(async () => {
                await result.current.onRename({ name: 'New name' })
            })

            expect(renameSpy).not.toHaveBeenCalled()
            expect(result.current.pendingLegacyRename).not.toBeNull()
        })

        it('does not rename when the fetch fails', async () => {
            const savedVis = makeSavedVis()
            spyOnFetch({})
            const renameSpy = spyOnRename()

            const { result } = renderWithSavedVis(savedVis)

            await act(async () => {
                await result.current.onRename({ name: 'New name' })
            })

            expect(renameSpy).not.toHaveBeenCalled()
            expect(result.current.pendingLegacyRename).toBeNull()
        })

        it('saves a confirmed legacy rename as a new visualization', async () => {
            const legacyVis = makeSavedVis({
                name: 'Old name',
                description: 'Old description',
                legacy: true,
                columns: [{ dimension: 'stage-1.eventDate', items: [] }],
            } as Partial<SavedVisualization>)
            spyOnFetch({ data: legacyVis })
            const createSpy = spyOnCreate()

            const { result, store } = renderToolbarActions({
                // unsaved edits in the editor must not end up in the copy
                currentVis: { ...toCurrentVis(legacyVis), columns: [] },
                savedVis: legacyVis,
            })

            await act(async () => {
                await result.current.onRename({
                    name: 'New name',
                    description: 'New description',
                })
            })
            await act(async () => {
                await result.current.onConfirmLegacyRename()
            })

            const payload = createSpy.mock.calls[0][0] as SavedVisualization
            expect(payload).toMatchObject({
                name: 'New name',
                description: 'New description',
                columns: [{ dimension: 'stage-1.eventDate', items: [] }],
            })
            expect(payload).not.toHaveProperty('id')
            expect(payload).not.toHaveProperty('legacy')
            expect(store.getState().navigation).toHaveProperty(
                'visualizationId',
                'new-vis'
            )
            expect(result.current.pendingLegacyRename).toBeNull()
        })

        it('saves nothing when a legacy rename is cancelled', async () => {
            const legacyVis = makeSavedVis({ legacy: true })
            spyOnFetch({ data: legacyVis })
            const createSpy = spyOnCreate()

            const { result } = renderWithSavedVis(legacyVis)

            await act(async () => {
                await result.current.onRename({ name: 'New name' })
            })
            act(() => {
                result.current.onCancelLegacyRename()
            })

            expect(createSpy).not.toHaveBeenCalled()
            expect(result.current.pendingLegacyRename).toBeNull()
        })
    })
})
