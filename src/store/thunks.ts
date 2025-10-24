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
import {
    preparePayloadForSave,
    preparePayloadForSaveAs,
} from '@dhis2/analytics'
import { getVisualizationUiConfig } from '@modules/get-visualization-ui-config'
import { getSaveableVisualization } from '@modules/visualization'
import type {
    AppDispatch,
    CurrentVisualization,
    SavedVisualization,
} from '@types'

export type AppAsyncThunkConfig = {
    state: RootState
    dispatch: AppDispatch
    extra: ThunkExtraArg
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
    {
        visualization: CurrentVisualization
        name: string
        description: string
        onError: (error: unknown) => void
    },
    AppAsyncThunkConfig
>(
    'visualization/create',
    async (
        {
            visualization,
            name,
            description,
            onError,
        }: {
            visualization: CurrentVisualization
            name: string
            description: string
            onError: (error: unknown) => void
        },
        { dispatch }
    ) => {
        const vis = preparePayloadForSaveAs({
            visualization: {
                ...getSaveableVisualization(visualization),
                subscribers: [],
            },
            name,
            description,
        })

        const { data, error } = await dispatch(
            eventVisualizationsApi.endpoints.createVisualization.initiate(vis)
        )
        if (data) {
            dispatch(setNavigationState({ visualizationId: data }))
        } else if (error) {
            onError(error)
        }
    }
)

export const tUpdateVisualization = createAsyncThunk<
    void,
    {
        visualization: Partial<SavedVisualization>
        onError: (error: unknown) => void
    },
    AppAsyncThunkConfig & { rejectValue: { error: boolean } }
>(
    'visualization/save',
    async (
        {
            visualization,
            onError,
        }: {
            visualization: Partial<SavedVisualization>
            onError: (error: unknown) => void
        },
        { dispatch }
    ) => {
        const vis = preparePayloadForSave({
            visualization: getSaveableVisualization(
                visualization as CurrentVisualization
            ),
        })

        const visId = vis.id
        if (!visId) {
            const err = new Error(
                'No current visualization ID found for saving.'
            )
            onError(err)
            return
        }

        const { data: subscribers } = await dispatch(
            eventVisualizationsApi.endpoints.getVisualizationSubscribers.initiate(
                visId,
                {
                    forceRefetch: true,
                }
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
            onError(error)
        }
    }
)

export const tRenameVisualization = createAsyncThunk<
    void,
    { id: string; name: string; description: string },
    AppAsyncThunkConfig & { rejectValue: { error: boolean } }
>(
    'visualization/rename',
    async (
        {
            id,
            name,
            description,
        }: { id: string; name: string; description: string },
        { dispatch, rejectWithValue }
    ) => {
        // get a fresh copy of the visualization, so nothing but name/description is changed
        const { data: visualization, error: fetchError } = await dispatch(
            eventVisualizationsApi.endpoints.getVisualization.initiate(id, {
                forceRefetch: true,
            })
        )
        if (!visualization || fetchError) {
            console.error(fetchError)
            return rejectWithValue({ error: true })
        }

        // prepare the visualization payload with the new name/description
        const visToSave = preparePayloadForSave({
            visualization: getSaveableVisualization(visualization),
            name,
            description,
        })

        // save the new name and description
        const { error: renameError } = await dispatch(
            eventVisualizationsApi.endpoints.updateVisualization.initiate(
                visToSave
            )
        )

        if (renameError) {
            console.error(renameError)
            return rejectWithValue({ error: true })
        }

        // fetch the visualization name,displayName,description,displayDescription
        const { data: visNameDesc } = await dispatch(
            eventVisualizationsApi.endpoints.getVisualizationNameDesc.initiate(
                id,
                {
                    forceRefetch: true,
                }
            )
        )

        if (visNameDesc) {
            const v = visNameDesc as Partial<Record<string, unknown>>
            const fields = {
                name: v.name,
                displayName: v.displayName,
                description: v.description,
                displayDescription: v.displayDescription,
            } as Partial<SavedVisualization>

            // update saved and current visualizations with only the changed fields
            dispatch(setSavedVis(fields as unknown as SavedVisualization))
            dispatch(setCurrentVis(fields as unknown as CurrentVisualization))
        }
    }
)
