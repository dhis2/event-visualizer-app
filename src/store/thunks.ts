import { createAsyncThunk } from '@reduxjs/toolkit'
import { clearCurrentVis, setCurrentVis } from './current-vis-slice'
import { setIsVisualizationLoading } from './loader-slice'
import { setNavigationState } from './navigation-slice'
import { clearSavedVis, setSavedVis } from './saved-vis-slice'
import type { RootState } from './store'
import { clearUi } from './ui-slice'
import { clearVisUiConfig, setVisUiConfig } from './vis-ui-config-slice'
import type { ThunkExtraArg } from '@api/custom-base-query'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import { getVisualizationUiConfig } from '@modules/get-visualization-ui-config'
import type {
    AppDispatch,
    CurrentVisualization,
    SavedVisualization,
} from '@types'

type AppAsyncThunkConfig = {
    state: RootState
    dispatch: AppDispatch
    extra: ThunkExtraArg
    rejectValue?: unknown
    serializedErrorType?: unknown
    fulfillMeta?: unknown
    rejectMeta?: unknown
}

export const tClearVisualization = () => (dispatch: AppDispatch) => {
    dispatch(clearUi())
    dispatch(clearSavedVis())
    dispatch(clearCurrentVis())
    dispatch(clearVisUiConfig())
}

export const tLoadSavedVisualization = createAsyncThunk<
    void,
    string,
    AppAsyncThunkConfig
>('visualization/load', async (id: string, { dispatch }) => {
    dispatch(setIsVisualizationLoading(true))

    const { data, error } = await dispatch(
        eventVisualizationsApi.endpoints.getVisualization.initiate(id, {
            // This is consistent with other analytics apps
            forceRefetch: true,
        })
    )
    if (data) {
        dispatch(setSavedVis(data))
        dispatch(setVisUiConfig(getVisualizationUiConfig(data)))
        dispatch(setCurrentVis(data))
        dispatch(setIsVisualizationLoading(false))
    } else if (error) {
        console.error(error)
    }
})

export const tCreateVisualization = createAsyncThunk<
    void,
    Partial<CurrentVisualization>,
    AppAsyncThunkConfig
>(
    'visualization/create',
    async (visualization: Partial<CurrentVisualization>, { dispatch }) => {
        const { data, error } = await dispatch(
            eventVisualizationsApi.endpoints.createVisualization.initiate(
                visualization
            )
        )
        if (data) {
            dispatch(setNavigationState({ visualizationId: data }))
        } else if (error) {
            console.error(error)
        }
    }
)

export const tUpdateVisualization = createAsyncThunk<
    void,
    Partial<SavedVisualization>,
    AppAsyncThunkConfig
>(
    'visualization/save',
    async (visualization: Partial<SavedVisualization>, { dispatch }) => {
        const visId = visualization.id
        if (!visId) {
            console.error('No current visualization ID found for saving.')
            return
        }

        // TODO handle error from subscribers query
        const { data: subscribers } = await dispatch(
            eventVisualizationsApi.endpoints.getVisualizationSubscribers.initiate(
                visId
            )
        )

        const { data, error } = await dispatch(
            eventVisualizationsApi.endpoints.updateVisualization.initiate({
                ...visualization,
                subscribers: subscribers,
            })
        )
        if (data) {
            // Reload the saved visualization after saving
            dispatch(tLoadSavedVisualization(visId))
        } else if (error) {
            console.error(error)
        }
    }
)
