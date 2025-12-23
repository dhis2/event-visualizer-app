import { createAsyncThunk } from '@reduxjs/toolkit'
import deepmerge from 'deepmerge'
import { clearCurrentVis, setCurrentVis } from './current-vis-slice'
import { setIsVisualizationLoading } from './loader-slice'
import { clearSavedVis, setSavedVis } from './saved-vis-slice'
import type { RootState } from './store'
import { clearUi } from './ui-slice'
import { clearVisUiConfig, setVisUiConfig } from './vis-ui-config-slice'
import type { ThunkExtraArg } from '@api/custom-base-query'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import { formatLayoutForVisualization } from '@modules/layout'
import { getDisabledOptions } from '@modules/options'
import {
    getVisualizationUiConfig,
    transformVisualization,
} from '@modules/visualization'
import type { AppDispatch, CurrentVisualization } from '@types'

type AppAsyncThunkConfig = {
    state: RootState
    dispatch: AppDispatch
    extra: ThunkExtraArg
    rejectValue?: unknown
    serializedErrorType?: unknown
    fulfillMeta?: unknown
    rejectMeta?: unknown
}

type AppThunk = () => (
    dispatch: AppDispatch,
    getState: () => RootState,
    extra: ThunkExtraArg
) => void

export const tClearVisualization: AppThunk = () => (dispatch) => {
    dispatch(clearUi())
    dispatch(clearSavedVis())
    dispatch(clearCurrentVis())
    dispatch(clearVisUiConfig())
}

type LoadSavedVisualizationPayload = {
    id: string
    updateStatistics?: boolean
}

export const tLoadSavedVisualization = createAsyncThunk<
    void,
    LoadSavedVisualizationPayload,
    AppAsyncThunkConfig
>(
    'visualization/load',
    async ({ id, updateStatistics = false }, { dispatch, extra }) => {
        dispatch(setIsVisualizationLoading(true))

        const { data, error } = await dispatch(
            eventVisualizationsApi.endpoints.getVisualization.initiate(id, {
                // This is consistent with other analytics apps
                forceRefetch: true,
            })
        )
        if (data) {
            const transformedVisualization = transformVisualization(data)

            dispatch(setSavedVis(data))
            dispatch(
                setVisUiConfig(
                    getVisualizationUiConfig(transformedVisualization)
                )
            )
            dispatch(setCurrentVis(data))
            dispatch(setIsVisualizationLoading(false))

            if (updateStatistics) {
                // update most viewed statistics
                extra.engine
                    .mutate({
                        resource: 'dataStatistics',
                        type: 'create',
                        params: {
                            eventType: 'EVENT_VISUALIZATION_VIEW',
                            favorite: id,
                        },
                        data: {},
                    })
                    .catch((error) => console.error(error))
            }
        } else if (error) {
            console.error(error)
        }
    }
)

export const tUpdateCurrentVisFromVisUiConfig: AppThunk =
    () => (dispatch, getState) => {
        const { currentVis, visUiConfig } = getState()

        const mergedVis = deepmerge(
            currentVis,
            visUiConfig.options
        ) as CurrentVisualization

        const disabledOptions = getDisabledOptions(visUiConfig.options)

        disabledOptions.forEach((disabledOption) => {
            delete mergedVis[disabledOption]
        })

        // Overrides
        const updatedCurrentVis = {
            ...mergedVis,
            // columns/rows/filters from visUiConfig.layout
            ...formatLayoutForVisualization(visUiConfig),
        }

        dispatch(setCurrentVis(updatedCurrentVis))
    }
