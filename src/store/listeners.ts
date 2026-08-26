import { isAnyOf } from '@reduxjs/toolkit'
import { startAppListening } from './middleware-listener'
import { setNavigationState } from './navigation-slice'
import {
    tClearVisualization,
    tLoadSavedVisualization,
    tSeedDefaultGrouping,
} from './thunks'
import { setUiActiveDimensionModal } from './ui-slice'
import {
    addVisUiConfigLayoutDimension,
    addVisUiConfigLayoutDimensions,
} from './vis-ui-config-slice'

export const registerAppListeners = () => {
    startAppListening({
        actionCreator: setNavigationState,
        effect: async (action, { dispatch, getOriginalState }) => {
            const originalState = getOriginalState()
            const originalVisualizationId =
                originalState.navigation.visualizationId
            const newVisualizationId = action.payload.visualizationId

            /* Since the InterpretationsModal loads its own visualization plugin
             * we are only interested in visualizationId changes in this
             * listener middleware */
            if (originalVisualizationId !== newVisualizationId) {
                // always clear the "old" visualization to keep consistency between the URL address, metadata store and Redux store
                dispatch(tClearVisualization())

                if (newVisualizationId !== 'new') {
                    dispatch(
                        tLoadSavedVisualization({
                            id: newVisualizationId,
                            updateStatistics: true,
                        })
                    )
                }
            } else if (newVisualizationId === 'new') {
                dispatch(tClearVisualization())
            }
        },
    })

    startAppListening({
        matcher: isAnyOf(
            addVisUiConfigLayoutDimension,
            addVisUiConfigLayoutDimensions,
            setUiActiveDimensionModal
        ),
        effect: (action, { dispatch }) => {
            if (addVisUiConfigLayoutDimension.match(action)) {
                dispatch(tSeedDefaultGrouping([action.payload.dimensionId]))
            } else if (addVisUiConfigLayoutDimensions.match(action)) {
                dispatch(tSeedDefaultGrouping(action.payload.dimensionIds))
            } else if (
                setUiActiveDimensionModal.match(action) &&
                action.payload !== null
            ) {
                dispatch(tSeedDefaultGrouping([action.payload]))
            }
        },
    })
}
