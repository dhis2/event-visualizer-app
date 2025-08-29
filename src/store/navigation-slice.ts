import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { clearCurrentVis, setCurrentVis } from './current-vis-slice'
import { listenerMiddleware } from './middleware/listener'
import { clearSavedVis, setSavedVis } from './saved-vis-slice'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import { SavedVisualization } from '@types'

export interface NavigationState {
    visualizationId: string | 'new'
    interpretationId: string | null
}

export const initialState: NavigationState = {
    visualizationId: 'new',
    interpretationId: null,
}

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
})

export const { setNavigationState } = navigationSlice.actions

listenerMiddleware.startListening({
    actionCreator: setNavigationState,
    effect: async (action, listenerApi) => {
        const dispatch = listenerApi.dispatch

        if (action.payload.visualizationId === 'new') {
            dispatch(clearSavedVis())
            dispatch(clearCurrentVis())
        } else {
            try {
                const eventVisualizationResult = await dispatch(
                    eventVisualizationsApi.endpoints.getVisualization.initiate(
                        action.payload.visualizationId
                    )
                )

                dispatch(
                    setSavedVis(
                        eventVisualizationResult.data as SavedVisualization
                    )
                )

                dispatch(
                    setCurrentVis(
                        eventVisualizationResult.data as SavedVisualization
                    )
                )
            } catch (err) {
                console.log('getEventVisualization error', err)
            }
        }
    },
})
