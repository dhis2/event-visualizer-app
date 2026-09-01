import { getLastUsedVisualizationTypeFromLocalStorage } from '@modules/visualization/local-storage'
import { configureStore } from '@reduxjs/toolkit'
import { registerAppListeners } from '@store/listeners'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listenerMiddleware } from '../middleware-listener'
import { navigationSlice, setNavigationState } from '../navigation-slice'
import type { NavigationState } from '../navigation-slice'
import { tClearVisualization, tLoadSavedVisualization } from '../thunks'
import {
    setVisUiConfigVisualizationType,
    visUiConfigSlice,
} from '../vis-ui-config-slice'

vi.mock('../thunks', () => ({
    tClearVisualization: vi.fn(() => ({ type: 'mock/tClearVisualization' })),
    tLoadSavedVisualization: vi.fn(() => ({
        type: 'mock/tLoadSavedVisualization',
    })),
    tSeedDefaultGrouping: vi.fn(() => ({ type: 'mock/tSeedDefaultGrouping' })),
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
        listenerMiddleware.clearListeners()
        registerAppListeners()
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

describe('visUiConfig visualization type listener', () => {
    beforeEach(() => {
        listenerMiddleware.clearListeners()
        registerAppListeners()
    })

    it('stores the chosen visualization type as the last used one', async () => {
        const store = configureStore({
            reducer: { visUiConfig: visUiConfigSlice.reducer },
            middleware: (getDefaultMiddleware) =>
                getDefaultMiddleware().prepend(listenerMiddleware.middleware),
        })

        store.dispatch(setVisUiConfigVisualizationType('PIVOT_TABLE'))
        await Promise.resolve()

        expect(getLastUsedVisualizationTypeFromLocalStorage()).toBe(
            'PIVOT_TABLE'
        )
    })
})
