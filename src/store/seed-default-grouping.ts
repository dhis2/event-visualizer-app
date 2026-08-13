import type { ThunkExtraArg } from '@api/custom-base-query'
import { legendSetsApi } from '@api/legend-sets-api'
import { canDimensionHaveLegendSets } from '@modules/dimension/grouping'
import { logger } from '@modules/logger'
import { isAnyOf } from '@reduxjs/toolkit'
import type { AppDispatch, RootState } from '@types'
import { startAppListening } from './middleware-listener'
import { setUiActiveDimensionModal } from './ui-slice'
import {
    addVisUiConfigLayoutDimension,
    addVisUiConfigLayoutDimensions,
    setVisUiConfigGroupingByDimension,
} from './vis-ui-config-slice'

/* A line list defaults to no grouping, which is the absence of state, so only
 * pivot tables need a default applied. Keyed off presence rather than value so
 * an explicit "No grouping" choice is never overwritten by the default. */
const tSeedDefaultGrouping =
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
