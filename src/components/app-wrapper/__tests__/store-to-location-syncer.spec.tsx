import { act } from '@testing-library/react'
import { describe, it, beforeEach, afterEach } from 'vitest'
import { StoreToLocationSyncer } from '../store-to-location-syncer'
import { history } from '@modules'
import { navigationReducer, setNavigationState } from '@store'
import { setupStore, renderWithReduxStoreProvider } from '@test-utils'
import type { RootState } from '@types'

describe('StoreToLocationSyncer', () => {
    let store: ReturnType<typeof setupStore> & {
        getState: () => Partial<RootState>
    }

    const initialNavigationState = {
        visualizationId: 'test-visualization',
        interpretationId: 'test-interpretation',
    }

    beforeEach(() => {
        if (!store) {
            store = setupStore(
                { navigation: navigationReducer },
                { navigation: initialNavigationState }
            )
        } else {
            store.dispatch(setNavigationState(initialNavigationState))
        }
        act(() => {
            history.push('/')
        })
    })

    afterEach(() => {
        act(() => {
            history.push('/')
        })
    })

    it('should dispatch setNavigationState on initial load', () => {
        act(() => {
            history.push(
                '/test-visualization?interpretationId=test-interpretation'
            )
        })

        renderWithReduxStoreProvider(<StoreToLocationSyncer />, store)

        const state = store.getState().navigation
        expect(state?.visualizationId).toBe('test-visualization')
        expect(state?.interpretationId).toBe('test-interpretation')
    })

    it('should update the state when the URL changes', () => {
        act(() => {
            history.push(
                '/test-visualization?interpretationId=test-interpretation'
            )
        })

        renderWithReduxStoreProvider(<StoreToLocationSyncer />, store)

        act(() => {
            history.push(
                '/new-visualization?interpretationId=new-interpretation'
            )
        })

        const state = store.getState().navigation
        expect(state?.visualizationId).toBe('new-visualization')
        expect(state?.interpretationId).toBe('new-interpretation')
    })

    it('ignore the interpretationId query param when on "/new" or "/"', () => {
        act(() => {
            history.push(
                '/test-visualization?interpretationId=test-interpretation'
            )
        })

        renderWithReduxStoreProvider(<StoreToLocationSyncer />, store)

        act(() => {
            history.push('/?interpretationId=test-interpretation')
        })
        const state1 = store.getState().navigation
        expect(state1?.visualizationId).toBe('new')
        expect(state1?.interpretationId).toBe(null)

        act(() => {
            history.push('/new?interpretationId=test-interpretation')
        })

        const state2 = store.getState().navigation
        expect(state2?.visualizationId).toBe('new')
        expect(state2?.interpretationId).toBe(null)
    })

    it('should update the URL when Redux state changes', () => {
        renderWithReduxStoreProvider(<StoreToLocationSyncer />, store)

        act(() => {
            store.dispatch(
                setNavigationState({
                    visualizationId: 'new-visualization',
                    interpretationId: 'new-interpretation',
                })
            )
        })

        const expectedPath =
            '/new-visualization?interpretationId=new-interpretation'
        expect(history.location.pathname + history.location.search).toBe(
            expectedPath
        )
    })

    it('should not update the URL if the visualizationId equals "new" and on path `/`', () => {
        store = setupStore(
            { navigation: navigationReducer },
            {
                navigation: {
                    visualizationId: 'new',
                    interpretationId: null,
                },
            }
        )

        renderWithReduxStoreProvider(<StoreToLocationSyncer />, store)

        expect(history.location.pathname).toBe('/')
    })

    it('should avoid duplicate actions for the same location', () => {
        act(() => {
            history.push(
                '/test-visualization?interpretationId=test-interpretation'
            )
        })

        renderWithReduxStoreProvider(<StoreToLocationSyncer />, store)

        // Push the same location again
        history.push('/test-visualization?interpretationId=test-interpretation')

        const state = store.getState().navigation
        expect(state?.visualizationId).toBe('test-visualization')
        expect(state?.interpretationId).toBe('test-interpretation')
    })
})
