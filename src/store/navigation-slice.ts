import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { clearCurrentVis, setCurrentVis } from './current-vis-slice'
import { startAppListening } from './middleware-listener'
import { clearSavedVis, setSavedVis } from './saved-vis-slice'
import { clearUi } from './ui-slice'
import { setVisUiConfig } from './vis-ui-config-slice'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import { getVisualizationUiConfig } from '@modules/get-visualization-ui-config'
import type { SavedVisualization } from '@types'

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

// listen to changes in navigation.visualizationId
// "new" (FileMenu -> New): clean the store
// "id" (FileMenu -> Open): fetch the visualization only if the id changes
startAppListening({
    predicate: (_, currentState, previousState) =>
        currentState.navigation.visualizationId !==
        previousState.navigation.visualizationId,
    effect: async (_, listenerApi) => {
        const dispatch = listenerApi.dispatch

        const visualizationId =
            listenerApi.getState().navigation.visualizationId

        if (visualizationId === 'new') {
            dispatch(clearUi())
            dispatch(clearSavedVis())
            dispatch(clearCurrentVis())
        } else {
            try {
                const eventVisualizationResult = await dispatch(
                    eventVisualizationsApi.endpoints.getVisualization.initiate(
                        visualizationId
                    )
                )

                dispatch(
                    setSavedVis(
                        eventVisualizationResult.data as SavedVisualization
                    )
                )

                dispatch(
                    setVisUiConfig(
                        getVisualizationUiConfig(
                            eventVisualizationResult.data as SavedVisualization
                        )
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

// listen to changes in navigation.interpretationId
startAppListening({
    predicate: (_, currentState, previousState) =>
        currentState.navigation.interpretationId !==
        previousState.navigation.interpretationId,
    effect: () => {
        console.log(
            'interpretationId changed - add the logic in place of this message'
        )
    },
})
