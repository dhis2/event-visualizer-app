import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { StartScreen } from '@components/start-screen/start-screen'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@hooks'
import { isVisualizationEmpty } from '@modules/visualization/state'
import { getCurrentVis, setCurrentVis } from '@store/current-vis-slice'
import {
    getIsVisualizationLoading,
    getVisualizationLoadError,
} from '@store/loader-slice'
import { tLoadSavedVisualization } from '@store/thunks'
import { setUiActiveDimensionModal } from '@store/ui-slice'
import type { Sorting } from '@types'
import { useCallback, type FC } from 'react'
import classes from './styles/canvas.module.css'
import { UnappliedChangesNotice } from './unapplied-changes-notice'

export const Canvas: FC = () => {
    const dispatch = useAppDispatch()
    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const visualizationLoadError = useAppSelector(getVisualizationLoadError)
    const visualizationId = useAppSelector(
        (state) => state.navigation.visualizationId
    )

    const onRetryLoad = useCallback(() => {
        if (visualizationId !== 'new') {
            dispatch(tLoadSavedVisualization({ id: visualizationId }))
        }
    }, [dispatch, visualizationId])

    const onDataSorted = useCallback(
        (sorting: Sorting | undefined) => {
            if (isVisualizationEmpty(currentVis)) {
                throw new Error(
                    'onDataSorted called with an empty visualization'
                )
            }
            dispatch(
                setCurrentVis({
                    ...currentVis,
                    sorting: sorting ? [sorting] : undefined,
                })
            )
        },
        [currentVis, dispatch]
    )

    const onColumnHeaderClick = useCallback(
        (dimensionId: string) => {
            dispatch(setUiActiveDimensionModal(dimensionId))
        },
        [dispatch]
    )

    if (
        isVisualizationEmpty(currentVis) &&
        !isVisualizationLoading &&
        !visualizationLoadError
    ) {
        return <StartScreen />
    }

    return (
        <div className={classes.container} data-test="canvas">
            <UnappliedChangesNotice />
            <PluginWrapper
                isVisualizationLoading={isVisualizationLoading}
                visualization={currentVis}
                visualizationLoadError={visualizationLoadError ?? undefined}
                onRetryLoad={onRetryLoad}
                displayProperty={currentUser.settings.displayProperty}
                onColumnHeaderClick={onColumnHeaderClick}
                onDataSorted={onDataSorted}
            />
        </div>
    )
}
