import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { startAppListening } from './middleware-listener'
import { tClearVisualization, tLoadSavedVisualization } from './thunks'
import { getNavigationStateFromLocation } from '@modules/history'

export interface NavigationState {
    visualizationId: string | 'new'
    interpretationId: string | null
}

export const initialState: NavigationState = getNavigationStateFromLocation()

export const navigationSlice = createSlice({
    name: 'navigation',
    initialState,
    reducers: {
        setNavigationState: (
            state,
            action: PayloadAction<{
                visualizationId: string | 'new'
                interpretationId?: string | null
            }>
        ) => {
            state.visualizationId = action.payload.visualizationId
            state.interpretationId = action.payload.interpretationId ?? null
        },
    },
    selectors: {
        getNavigationInterpretationId: (state) => state.interpretationId,
    },
})

export const { setNavigationState } = navigationSlice.actions
export const { getNavigationInterpretationId } = navigationSlice.selectors

startAppListening({
    actionCreator: setNavigationState,
    effect: async (action, { dispatch, getOriginalState }) => {
        const originalState = getOriginalState()
        const originalVisualizationId = originalState.navigation.visualizationId
        const newVisualizationId = action.payload.visualizationId

        /* Since the InterpretationsModal loads its own visualization plugin
         * we are only interested in visualizationId changes in this
         * listener middleware */
        if (originalVisualizationId !== newVisualizationId) {
            if (newVisualizationId === 'new') {
                dispatch(tClearVisualization())
            } else {
                dispatch(tLoadSavedVisualization(newVisualizationId))
            }
        }
    },
})
