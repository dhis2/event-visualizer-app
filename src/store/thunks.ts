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
import type { AppDispatch, CurrentVisualization, MetadataStore } from '@types'
import {
    clearCurrentVis,
    setCurrentVis,
    type CurrentVisState,
} from './current-vis-slice'
import { setDataSourceId } from './dimensions-selection-slice'
import { setIsVisualizationLoading, setLoadError } from './loader-slice'
import { clearSavedVis, setSavedVis } from './saved-vis-slice'
import type { RootState } from './store'
import { clearUi, setUiUpdateAnimationShowingFor } from './ui-slice'
import {
    clearVisUiConfig,
    setVisUiConfig,
    type VisUiConfigState,
} from './vis-ui-config-slice'

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

/* One custom value spans every output type: the same item shows in the cells
 * of an event, enrollment or tracked entity table. */
const resolveCustomValueFields = ({ customValue }: VisUiConfigState) => {
    /* Always include the `value` key: setCurrentVis merges into the previous
     * currentVis, so omitting it would leave a stale value behind. */
    if (!customValue) {
        return { value: undefined, aggregationType: undefined }
    }

    return {
        value: { id: customValue.id },
        aggregationType: customValue.aggregationType,
    }
}

/* Rebuild a currentVis fresh from visUiConfig so stale currentVis fields can't
 * leak through. Carries over only id and sorting from the previous currentVis.
 * The custom value fields go after the options spread so the value's own
 * aggregation type wins over the options default. */
export const buildCurrentVisFromVisUiConfig = ({
    previousCurrentVis,
    visUiConfig,
    metadataStore,
}: {
    previousCurrentVis: CurrentVisState
    visUiConfig: VisUiConfigState
    metadataStore: MetadataStore
}): CurrentVisualization => ({
    id: isCurrentVisualizationPersisted(previousCurrentVis)
        ? previousCurrentVis.id
        : undefined,
    sorting: isVisualizationEmpty(previousCurrentVis)
        ? undefined
        : previousCurrentVis.sorting,
    type: visUiConfig.visualizationType,
    outputType: visUiConfig.outputType,
    columns: buildAxis(visUiConfig.layout.columns, visUiConfig, metadataStore),
    rows: buildAxis(visUiConfig.layout.rows, visUiConfig, metadataStore),
    filters: buildAxis(visUiConfig.layout.filters, visUiConfig, metadataStore),
    programDimensions: collectProgramDimensions(visUiConfig, metadataStore),
    ...getEnabledOptions(visUiConfig.options),
    ...resolveTeiFields(visUiConfig, metadataStore),
    ...resolveCustomValueFields(visUiConfig),
})

export const tUpdateCurrentVisFromVisUiConfig =
    () =>
    (
        dispatch: AppDispatch,
        getState: () => RootState,
        extra: ThunkExtraArg
    ) => {
        const { currentVis, visUiConfig } = getState()

        dispatch(
            setCurrentVis(
                buildCurrentVisFromVisUiConfig({
                    previousCurrentVis: currentVis,
                    visUiConfig,
                    metadataStore: extra.metadataStore,
                })
            )
        )
        dispatch(
            setUiUpdateAnimationShowingFor(
                isVisualizationEmpty(currentVis) ? null : visUiConfig.outputType
            )
        )
    }
