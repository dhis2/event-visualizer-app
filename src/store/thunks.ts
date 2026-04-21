import type { ThunkExtraArg } from '@api/custom-base-query'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import { extractDataSourceIdFromVisualization } from '@modules/data-source'
import {
    buildTeiFieldsFromLayout,
    formatLayoutForVisualization,
    formatProgramDimensionsForVisualization,
} from '@modules/layout'
import { getDisabledOptions } from '@modules/options'
import {
    getVisualizationUiConfig,
    isVisualizationEmpty,
    toCurrentVis,
} from '@modules/visualization'
import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AppDispatch, CurrentVisualization } from '@types'
import deepmerge from 'deepmerge'
import { clearCurrentVis, setCurrentVis } from './current-vis-slice'
import { setDataSourceId } from './dimensions-selection-slice'
import { setIsVisualizationLoading, setLoadError } from './loader-slice'
import { clearSavedVis, setSavedVis } from './saved-vis-slice'
import type { RootState } from './store'
import { clearUi } from './ui-slice'
import { clearVisUiConfig, setVisUiConfig } from './vis-ui-config-slice'

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
            const currentVis = toCurrentVis(data)
            const selectedDataSourceId =
                extractDataSourceIdFromVisualization(currentVis)

            dispatch(setSavedVis(data))
            dispatch(setDataSourceId(selectedDataSourceId))
            dispatch(setVisUiConfig(getVisualizationUiConfig(currentVis)))
            dispatch(setCurrentVis(currentVis))
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
            dispatch(setLoadError(error))
            dispatch(setIsVisualizationLoading(false))
        }
    }
)

export const tUpdateCurrentVisFromVisUiConfig: AppThunk =
    () => (dispatch, getState, extra) => {
        const { currentVis, visUiConfig } = getState()

        if (isVisualizationEmpty(currentVis)) {
            throw new Error(
                'tUpdateCurrentVisFromVisUiConfig called with an empty visualization'
            )
        }

        const mergedVis = deepmerge(
            currentVis as Record<string, unknown>,
            visUiConfig.options as Record<string, unknown>
        ) as CurrentVisualization

        const disabledOptions = getDisabledOptions(visUiConfig.options)

        disabledOptions.forEach((disabledOption) => {
            delete mergedVis[disabledOption]
        })

        // Overrides
        const updatedCurrentVis: CurrentVisualization = {
            ...mergedVis,
            // visualization type
            type: visUiConfig.visualizationType,
            outputType: visUiConfig.outputType,
            // custom value and aggregation
            ...(visUiConfig.customValue && {
                value: {
                    id: visUiConfig.customValue.id,
                },
                aggregationType: visUiConfig.customValue.aggregationType,
            }),
            // columns/rows/filters from visUiConfig.layout — the metadata
            // store provides the decomposed context (programId, programStageId)
            // for each compound dimension ID.
            ...formatLayoutForVisualization(
                visUiConfig,
                extra.metadataStore.getDimensionMetadataItem.bind(
                    extra.metadataStore
                )
            ),
            // Reset TEI-related fields before applying buildTeiFieldsFromLayout.
            // The helper returns them sparsely (omits when not populated), so
            // without this reset stale values from mergedVis could survive.
            trackedEntityType: undefined,
            attributeDimensions: undefined,
            ...buildTeiFieldsFromLayout(visUiConfig, extra.metadataStore),
            programDimensions: formatProgramDimensionsForVisualization(
                visUiConfig,
                extra.metadataStore
            ),
        }

        dispatch(setCurrentVis(updatedCurrentVis))
    }
