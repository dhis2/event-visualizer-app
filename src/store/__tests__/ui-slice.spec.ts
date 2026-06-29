import { describe, it, expect } from 'vitest'
import type { UiState } from '../ui-slice'
import {
    uiSlice,
    initialState,
    clearUi,
    setUiUpdateAnimationShowingFor,
    toggleUiDetailsPanelVisible,
    toggleUiSidebarVisible,
    toggleUiLayoutPanelVisible,
    toggleUiShowExpandedVisualizationCanvas,
    resetUiLayoutPanelHeightCounter,
    getUiShowExpandedVisualizationCanvas,
    getUiSidebarVisible,
    getUiLayoutPanelVisible,
    getUiLayoutPanelHeightResetCounter,
    getUiDetailsPanelVisible,
    getUiUpdateAnimationShowingFor,
} from '../ui-slice'

type RootState = {
    ui: UiState
}

const createRootState = (uiState: Partial<UiState>): RootState => ({
    ui: {
        ...initialState,
        ...uiState,
    },
})

describe('uiSlice', () => {
    const reducer = uiSlice.reducer

    it('should return the initial state', () => {
        expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState)
    })

    describe('toggleUiShowExpandedVisualizationCanvas', () => {
        it('should hide all panels when entering fullscreen', () => {
            const state = reducer(
                initialState,
                toggleUiShowExpandedVisualizationCanvas()
            )

            expect(state.isSidebarVisible).toBe(false)
            expect(state.isLayoutPanelVisible).toBe(false)
            expect(state.isDetailsPanelVisible).toBe(false)
        })

        it('should save panel visibility when entering fullscreen', () => {
            const prevState: UiState = {
                ...initialState,
                isSidebarVisible: true,
                isLayoutPanelVisible: false,
                isDetailsPanelVisible: true,
            }

            const state = reducer(
                prevState,
                toggleUiShowExpandedVisualizationCanvas()
            )

            expect(state.savedPanelVisibility).toEqual({
                isSidebarVisible: true,
                isLayoutPanelVisible: false,
                isDetailsPanelVisible: true,
            })
        })

        it('should restore saved panel visibility when exiting fullscreen', () => {
            const prevState: UiState = {
                ...initialState,
                isSidebarVisible: false,
                isLayoutPanelVisible: false,
                isDetailsPanelVisible: false,
                savedPanelVisibility: {
                    isSidebarVisible: true,
                    isLayoutPanelVisible: false,
                    isDetailsPanelVisible: true,
                },
            }

            const state = reducer(
                prevState,
                toggleUiShowExpandedVisualizationCanvas()
            )

            expect(state.isSidebarVisible).toBe(true)
            expect(state.isLayoutPanelVisible).toBe(false)
            expect(state.isDetailsPanelVisible).toBe(true)
            expect(state.savedPanelVisibility).toBeNull()
        })

        it('should restore initial defaults when exiting implicit fullscreen', () => {
            const prevState: UiState = {
                ...initialState,
                isSidebarVisible: false,
                isLayoutPanelVisible: false,
                isDetailsPanelVisible: false,
                savedPanelVisibility: null,
            }

            const state = reducer(
                prevState,
                toggleUiShowExpandedVisualizationCanvas()
            )

            expect(state.isSidebarVisible).toBe(initialState.isSidebarVisible)
            expect(state.isLayoutPanelVisible).toBe(
                initialState.isLayoutPanelVisible
            )
            expect(state.isDetailsPanelVisible).toBe(
                initialState.isDetailsPanelVisible
            )
            expect(state.savedPanelVisibility).toBeNull()
        })

        it('should round-trip: enter then exit fullscreen restores original state', () => {
            const prevState: UiState = {
                ...initialState,
                isSidebarVisible: true,
                isLayoutPanelVisible: false,
                isDetailsPanelVisible: true,
            }

            const fullscreen = reducer(
                prevState,
                toggleUiShowExpandedVisualizationCanvas()
            )
            const restored = reducer(
                fullscreen,
                toggleUiShowExpandedVisualizationCanvas()
            )

            expect(restored.isSidebarVisible).toBe(true)
            expect(restored.isLayoutPanelVisible).toBe(false)
            expect(restored.isDetailsPanelVisible).toBe(true)
        })
    })

    describe('individual panel toggles clear savedPanelVisibility', () => {
        const fullscreenState: UiState = {
            ...initialState,
            isSidebarVisible: false,
            isLayoutPanelVisible: false,
            isDetailsPanelVisible: false,
            savedPanelVisibility: {
                isSidebarVisible: true,
                isLayoutPanelVisible: true,
                isDetailsPanelVisible: false,
            },
        }

        it('toggleUiSidebarVisible clears savedPanelVisibility', () => {
            const state = reducer(fullscreenState, toggleUiSidebarVisible())

            expect(state.isSidebarVisible).toBe(true)
            expect(state.savedPanelVisibility).toBeNull()
        })

        it('toggleUiLayoutPanelVisible clears savedPanelVisibility', () => {
            const state = reducer(fullscreenState, toggleUiLayoutPanelVisible())

            expect(state.isLayoutPanelVisible).toBe(true)
            expect(state.savedPanelVisibility).toBeNull()
        })

        it('toggleUiDetailsPanelVisible clears savedPanelVisibility', () => {
            const state = reducer(
                fullscreenState,
                toggleUiDetailsPanelVisible()
            )

            expect(state.isDetailsPanelVisible).toBe(true)
            expect(state.savedPanelVisibility).toBeNull()
        })
    })

    describe('implicit fullscreen via individual toggles', () => {
        it('hiding all panels one by one then exiting restores defaults', () => {
            let state = reducer(initialState, toggleUiSidebarVisible())
            state = reducer(state, toggleUiLayoutPanelVisible())

            // All panels now hidden (details was already false in initialState)
            expect(state.isSidebarVisible).toBe(false)
            expect(state.isLayoutPanelVisible).toBe(false)
            expect(state.isDetailsPanelVisible).toBe(false)
            expect(state.savedPanelVisibility).toBeNull()

            // Exit fullscreen should restore defaults
            state = reducer(state, toggleUiShowExpandedVisualizationCanvas())

            expect(state.isSidebarVisible).toBe(initialState.isSidebarVisible)
            expect(state.isLayoutPanelVisible).toBe(
                initialState.isLayoutPanelVisible
            )
            expect(state.isDetailsPanelVisible).toBe(
                initialState.isDetailsPanelVisible
            )
        })
    })

    describe('view menu while fullscreen', () => {
        it('toggling a panel on while fullscreen clears snapshot', () => {
            // Enter fullscreen explicitly
            let state = reducer(
                initialState,
                toggleUiShowExpandedVisualizationCanvas()
            )

            expect(state.savedPanelVisibility).not.toBeNull()

            // Use view menu to show sidebar
            state = reducer(state, toggleUiSidebarVisible())

            expect(state.isSidebarVisible).toBe(true)
            expect(state.savedPanelVisibility).toBeNull()
        })
    })

    describe('clearUi', () => {
        it('should reset all state including savedPanelVisibility', () => {
            const prevState: UiState = {
                ...initialState,
                isSidebarVisible: false,
                savedPanelVisibility: {
                    isSidebarVisible: true,
                    isLayoutPanelVisible: true,
                    isDetailsPanelVisible: false,
                },
            }

            const state = reducer(prevState, clearUi())

            expect(state).toEqual(initialState)
        })
    })

    describe('resetUiLayoutPanelHeightCounter', () => {
        it('increments the counter without touching other state', () => {
            const state = reducer(
                initialState,
                resetUiLayoutPanelHeightCounter()
            )

            expect(state.layoutPanelHeightResetCounter).toBe(1)
            expect({
                ...state,
                layoutPanelHeightResetCounter:
                    initialState.layoutPanelHeightResetCounter,
            }).toEqual(initialState)
        })

        it('increments on each dispatch so repeat resets are distinct', () => {
            let state = reducer(initialState, resetUiLayoutPanelHeightCounter())
            state = reducer(state, resetUiLayoutPanelHeightCounter())

            expect(state.layoutPanelHeightResetCounter).toBe(2)
        })
    })

    describe('setUiUpdateAnimationShowingFor', () => {
        it('records the output type whose update button should animate', () => {
            const state = reducer(
                initialState,
                setUiUpdateAnimationShowingFor('EVENT')
            )

            expect(state.updateAnimationShowingFor).toBe('EVENT')
        })

        it('clears the flag when set to null', () => {
            const prevState: UiState = {
                ...initialState,
                updateAnimationShowingFor: 'ENROLLMENT',
            }

            const state = reducer(
                prevState,
                setUiUpdateAnimationShowingFor(null)
            )

            expect(state.updateAnimationShowingFor).toBeNull()
        })
    })

    describe('selectors', () => {
        it('getUiShowExpandedVisualizationCanvas returns true when all panels hidden', () => {
            const rootState = createRootState({
                isSidebarVisible: false,
                isLayoutPanelVisible: false,
                isDetailsPanelVisible: false,
            })

            expect(getUiShowExpandedVisualizationCanvas(rootState)).toBe(true)
        })

        it('getUiShowExpandedVisualizationCanvas returns false when any panel visible', () => {
            const rootState = createRootState({
                isSidebarVisible: false,
                isLayoutPanelVisible: false,
                isDetailsPanelVisible: true,
            })

            expect(getUiShowExpandedVisualizationCanvas(rootState)).toBe(false)
        })

        it('panel visibility selectors return the state directly', () => {
            const rootState = createRootState({
                isSidebarVisible: true,
                isLayoutPanelVisible: false,
                isDetailsPanelVisible: true,
            })

            expect(getUiSidebarVisible(rootState)).toBe(true)
            expect(getUiLayoutPanelVisible(rootState)).toBe(false)
            expect(getUiDetailsPanelVisible(rootState)).toBe(true)
        })

        it('getUiLayoutPanelHeightResetCounter returns the counter value', () => {
            const rootState = createRootState({
                layoutPanelHeightResetCounter: 3,
            })

            expect(getUiLayoutPanelHeightResetCounter(rootState)).toBe(3)
        })

        it('getUiUpdateAnimationShowingFor returns the stored output type', () => {
            const rootState = createRootState({
                updateAnimationShowingFor: 'EVENT',
            })

            expect(getUiUpdateAnimationShowingFor(rootState)).toBe('EVENT')
        })
    })
})
