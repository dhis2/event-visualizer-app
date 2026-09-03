import type { ThunkExtraArg } from '@api/custom-base-query'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import { legendSetsApi } from '@api/legend-sets-api'
import { isEngineError, parseEngineError } from '@api/parse-engine-error'
import { extractDataSourceIdFromVisualization } from '@modules/data-source'
import { canDimensionHaveLegendSets } from '@modules/dimension/grouping'
import {
    buildAxis,
    collectProgramDimensions,
    resolveTeiFields,
} from '@modules/layout'
import { logger } from '@modules/logger'
import { getEnabledOptions } from '@modules/options'
import { setLastUsedVisualizationTypeToLocalStorage } from '@modules/visualization/local-storage'
import {
    getVisualizationUiConfig,
    isCurrentVisualizationPersisted,
    isVisualizationEmpty,
    toCurrentVis,
} from '@modules/visualization/state'
import { createAsyncThunk } from '@reduxjs/toolkit'
import type {
    AppDispatch,
    CurrentVisualization,
    MetadataStore,
    RootState,
} from '@types'
import {
    clearCurrentVis,
    setCurrentVis,
    type CurrentVisState,
} from './current-vis-slice'
import { setDataSourceId } from './dimensions-selection-slice'
import {
    setIsVisualizationLoading,
    setVisualizationLoadError,
} from './loader-slice'
import { clearSavedVis, setSavedVis } from './saved-vis-slice'
import { clearUi, setUiUpdateAnimationShowingFor } from './ui-slice'
import {
    clearVisUiConfig,
    setVisUiConfig,
    setVisUiConfigGroupingByDimension,
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
            try {
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
            } catch (processingError) {
                /* A failure turning the fetched visualization into current-vis
                 * state is a bug, not a fetch error; parseEngineError tags it
                 * 'runtime', so it surfaces as fatal. */
                dispatch(
                    setVisualizationLoadError(parseEngineError(processingError))
                )
                dispatch(setIsVisualizationLoading(false))
            }
        } else if (error) {
            /* The base query parses anything that came off the wire; only
             * RTK's own serialized errors still need it. Parsing twice flattens
             * a fetch failure into a fatal 'runtime' error. */
            dispatch(
                setVisualizationLoadError(
                    isEngineError(error) ? error : parseEngineError(error)
                )
            )
            dispatch(setIsVisualizationLoading(false))
        }
    }
)

const shouldPopulateCustomValueFields = (
    currentVis: CurrentVisState,
    visUiConfig: VisUiConfigState,
    withCustomValue?: boolean
): boolean => {
    // Only EVENT output can carry a custom value
    if (visUiConfig.outputType !== 'EVENT') {
        return false
    }
    if (withCustomValue !== undefined) {
        return withCustomValue // explicit request: add or strip
    }
    return Boolean(currentVis.value?.id) // preserve what the current vis shows
}

const resolveCustomValueFields = (
    currentVis: CurrentVisState,
    visUiConfig: VisUiConfigState,
    withCustomValue?: boolean
) => {
    // Always include the `value` key: setCurrentVis merges into the previous
    // currentVis, so omitting it would leave a stale value behind.
    if (
        !shouldPopulateCustomValueFields(
            currentVis,
            visUiConfig,
            withCustomValue
        )
    ) {
        return { value: undefined, aggregationType: undefined }
    }

    const { customValue } = visUiConfig

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

/* Rebuild a currentVis fresh from visUiConfig so stale currentVis fields can't
 * leak through. Carries over only id and sorting from the previous currentVis.
 * The custom value fields go after the options spread so the value's own
 * aggregation type wins over the options default. `withCustomValue` overrides
 * whether the result carries the custom value: true forces it on, false strips
 * it; omit it to preserve the previous currentVis. */
export const buildCurrentVisFromVisUiConfig = ({
    previousCurrentVis,
    visUiConfig,
    metadataStore,
    withCustomValue,
}: {
    previousCurrentVis: CurrentVisState
    visUiConfig: VisUiConfigState
    metadataStore: MetadataStore
    withCustomValue?: boolean
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
    ...resolveCustomValueFields(
        previousCurrentVis,
        visUiConfig,
        withCustomValue
    ),
})

export const tUpdateCurrentVisFromVisUiConfig =
    (withCustomValue?: boolean) =>
    (
        dispatch: AppDispatch,
        getState: () => RootState,
        extra: ThunkExtraArg
    ) => {
        const { currentVis, visUiConfig } = getState()

        // Applying the config commits to the vis type; loading one does not.
        setLastUsedVisualizationTypeToLocalStorage(
            visUiConfig.visualizationType
        )

        dispatch(
            setCurrentVis(
                buildCurrentVisFromVisUiConfig({
                    previousCurrentVis: currentVis,
                    visUiConfig,
                    metadataStore: extra.metadataStore,
                    withCustomValue,
                })
            )
        )
        dispatch(
            setUiUpdateAnimationShowingFor(
                isVisualizationEmpty(currentVis) ? null : visUiConfig.outputType
            )
        )
    }

/* A line list defaults to no grouping, which is the absence of state, so only
 * pivot tables need a default applied. Keyed off presence rather than value so
 * an explicit "No grouping" choice is never overwritten by the default.
 *
 * A thunk rather than the listener effect itself because the listener
 * middleware is created without an extra argument, so only a thunk can reach
 * the metadata store. */
export const tSeedDefaultGrouping =
    (dimensionIds: string[]) =>
    async (
        dispatch: AppDispatch,
        getState: () => RootState,
        extra: ThunkExtraArg
    ) => {
        if (getState().visUiConfig.visualizationType !== 'PIVOT_TABLE') {
            return
        }

        const seedable = dimensionIds.filter((dimensionId) => {
            if (dimensionId in getState().visUiConfig.conditionsByDimension) {
                return false
            }
            const dimension =
                extra.metadataStore.getDimensionMetadataItem(dimensionId)

            return Boolean(dimension && canDimensionHaveLegendSets(dimension))
        })

        await Promise.all(
            seedable.map(async (dimensionId) => {
                const dimensionType =
                    extra.metadataStore.getDimensionMetadataItem(
                        dimensionId
                    )?.dimensionType

                if (!dimensionType) {
                    return
                }

                try {
                    const legendSets = await dispatch(
                        legendSetsApi.endpoints.getLegendSetsByDimension.initiate(
                            { dimensionId, dimensionType }
                        )
                    ).unwrap()

                    const defaultLegendSet = legendSets[0]

                    /* Re-checked because the user can pick a grouping while
                     * the legend sets are still being fetched. */
                    const isStillUnset = !(
                        dimensionId in
                        getState().visUiConfig.conditionsByDimension
                    )

                    if (defaultLegendSet && isStillUnset) {
                        dispatch(
                            setVisUiConfigGroupingByDimension({
                                dimensionId,
                                legendSet: defaultLegendSet.id,
                            })
                        )
                    }
                } catch (error) {
                    logger.error(
                        `Could not resolve legend sets for dimension "${dimensionId}"`,
                        error
                    )
                }
            })
        )
    }
