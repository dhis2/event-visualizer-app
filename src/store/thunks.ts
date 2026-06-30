import type { ThunkExtraArg } from '@api/custom-base-query'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import { extractDataSourceIdFromVisualization } from '@modules/data-source'
import {
    buildAxis,
    collectProgramDimensions,
    resolveTeiFields,
} from '@modules/layout'
import { logger } from '@modules/logger'
import { getEnabledOptions } from '@modules/options'
import {
    getVisualizationUiConfig,
    isCurrentVisualizationPersisted,
    isVisualizationEmpty,
    toCurrentVis,
} from '@modules/visualization/state'
import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AppDispatch, CurrentVisualization } from '@types'
import { clearCurrentVis, setCurrentVis } from './current-vis-slice'
import { setDataSourceId } from './dimensions-selection-slice'
import { setIsVisualizationLoading, setLoadError } from './loader-slice'
import { clearSavedVis, setSavedVis } from './saved-vis-slice'
import type { RootState } from './store'
import { clearUi, setUiUpdateAnimationShowingFor } from './ui-slice'
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
    async ({ id, updateStatistics = false }, { dispatch, getState, extra }) => {
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
            const currentOptions = getState().visUiConfig.options

            dispatch(setSavedVis(data))
            dispatch(setDataSourceId(selectedDataSourceId))
            dispatch(
                setVisUiConfig(
                    getVisualizationUiConfig(currentVis, currentOptions)
                )
            )
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
                    .catch((error) => logger.error(error))
            }
        } else if (error) {
            dispatch(setLoadError(error))
            dispatch(setIsVisualizationLoading(false))
        }
    }
)

const shouldPopulateCustomValueFields = (
    state: RootState,
    withCustomValue?: boolean
): boolean => {
    // Only EVENT output can carry a custom value
    if (state.visUiConfig.outputType !== 'EVENT') {
        return false
    }
    if (withCustomValue !== undefined) {
        return withCustomValue // explicit request: add or strip
    }
    return Boolean(state.currentVis.value?.id) // preserve what the current vis shows
}

const resolveCustomValueFields = (
    state: RootState,
    withCustomValue?: boolean
) => {
    // Always include the `value` key: setCurrentVis merges into the previous
    // currentVis, so omitting it would leave a stale value behind.
    if (!shouldPopulateCustomValueFields(state, withCustomValue)) {
        return { value: undefined, aggregationType: undefined }
    }

    const { customValue } = state.visUiConfig

    if (!customValue) {
        throw new Error(
            'shouldPopulateCustomValueFields is true but visUiConfig.customValue is missing'
        )
    }
    return {
        value: { id: customValue.id },
        aggregationType: customValue.aggregationType,
    }
}

/* `withCustomValue` overrides whether the rebuilt vis carries the custom
 * value: true forces it on, false strips it; omit it to preserve the
 * current vis. */
export const tUpdateCurrentVisFromVisUiConfig =
    (withCustomValue?: boolean) =>
    (
        dispatch: AppDispatch,
        getState: () => RootState,
        extra: ThunkExtraArg
    ) => {
        const state = getState()
        const { currentVis, visUiConfig } = state
        const { metadataStore } = extra

        // Build fresh from visUiConfig so stale currentVis fields can't leak
        // through. Carry over only id and sorting from the previous currentVis.
        // The custom value fields go after the options spread so the value's
        // own aggregation type wins over the options default.
        const updatedCurrentVis: CurrentVisualization = {
            id: isCurrentVisualizationPersisted(currentVis)
                ? currentVis.id
                : undefined,
            sorting: isVisualizationEmpty(currentVis)
                ? undefined
                : currentVis.sorting,
            type: visUiConfig.visualizationType,
            // output type
            outputType: visUiConfig.outputType,
            columns: buildAxis(
                visUiConfig.layout.columns,
                visUiConfig,
                metadataStore
            ),
            rows: buildAxis(
                visUiConfig.layout.rows,
                visUiConfig,
                metadataStore
            ),
            filters: buildAxis(
                visUiConfig.layout.filters,
                visUiConfig,
                metadataStore
            ),
            programDimensions: collectProgramDimensions(
                visUiConfig,
                metadataStore
            ),
            ...getEnabledOptions(visUiConfig.options),
            ...resolveTeiFields(visUiConfig, metadataStore),
            ...resolveCustomValueFields(state, withCustomValue),
        }

        dispatch(setCurrentVis(updatedCurrentVis))
        dispatch(
            setUiUpdateAnimationShowingFor(
                isVisualizationEmpty(currentVis) ? null : visUiConfig.outputType
            )
        )
    }
