import { createAsyncThunk } from '@reduxjs/toolkit'
import { clearCurrentVis, setCurrentVis } from './current-vis-slice'
import { clearSavedVis, setSavedVis } from './saved-vis-slice'
import type { RootState } from './store'
import { clearUi } from './ui-slice'
import { setVisUiConfig } from './vis-ui-config-slice'
import type { ThunkExtraArg } from '@api/custom-base-query'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import { getVisualizationUiConfig } from '@modules/visualization'
import type { AppDispatch } from '@types'

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
}

export const tLoadSavedVisualization = createAsyncThunk<
    void,
    string,
    AppAsyncThunkConfig
>('visualization/load', async (id: string, { dispatch }) => {
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
    } else if (error) {
        console.error(error)
    }
})
