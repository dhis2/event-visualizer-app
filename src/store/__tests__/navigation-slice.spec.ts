import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listenerMiddleware } from '../middleware-listener'
import { navigationSlice, setNavigationState } from '../navigation-slice'
import type { NavigationState } from '../navigation-slice'
import { tClearVisualization, tLoadSavedVisualization } from '../thunks'

vi.mock('../thunks', () => ({
    tClearVisualization: vi.fn(() => ({ type: 'mock/tClearVisualization' })),
    tLoadSavedVisualization: vi.fn(() => ({
        type: 'mock/tLoadSavedVisualization',
    })),
}))

const createStore = (visualizationId: NavigationState['visualizationId']) =>
    configureStore({
        reducer: { navigation: navigationSlice.reducer },
        preloadedState: {
            navigation: { visualizationId, interpretationId: null },
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    })

describe('navigationSlice listener', () => {
    beforeEach(() => {
        vi.mocked(tClearVisualization).mockClear()
        vi.mocked(tLoadSavedVisualization).mockClear()
    })

    it('clears and loads when visualizationId changes from one existing id to another', async () => {
        const store = createStore('vis-a')

        store.dispatch(setNavigationState({ visualizationId: 'vis-b' }))
        await Promise.resolve()

        expect(tClearVisualization).toHaveBeenCalledTimes(1)
        expect(tLoadSavedVisualization).toHaveBeenCalledWith({
            id: 'vis-b',
            updateStatistics: true,
        })
    })

    it('clears but does not load when transitioning from an existing id to "new"', async () => {
        const store = createStore('vis-a')

        store.dispatch(setNavigationState({ visualizationId: 'new' }))
        await Promise.resolve()

        expect(tClearVisualization).toHaveBeenCalledTimes(1)
        expect(tLoadSavedVisualization).not.toHaveBeenCalled()
    })

    it('clears when "new" is dispatched while already on "new"', async () => {
        const store = createStore('new')

        store.dispatch(setNavigationState({ visualizationId: 'new' }))
        await Promise.resolve()

        expect(tClearVisualization).toHaveBeenCalledTimes(1)
        expect(tLoadSavedVisualization).not.toHaveBeenCalled()
    })

    it('does nothing when the same existing visualizationId is dispatched again', async () => {
        const store = createStore('vis-a')

        store.dispatch(setNavigationState({ visualizationId: 'vis-a' }))
        await Promise.resolve()

        expect(tClearVisualization).not.toHaveBeenCalled()
        expect(tLoadSavedVisualization).not.toHaveBeenCalled()
    })
})
