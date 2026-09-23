import { useHasUnappliedChanges } from '@components/layout-panel/bottom-bar/use-has-unapplied-changes'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { StartScreen } from '@components/start-screen/start-screen'
import i18n from '@dhis2/d2-i18n'
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
import cx from 'classnames'
import { useCallback, type FC } from 'react'
import classes from './styles/canvas.module.css'

export const Canvas: FC = () => {
    const dispatch = useAppDispatch()
    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const visualizationLoadError = useAppSelector(getVisualizationLoadError)
    const visualizationId = useAppSelector(
        (state) => state.navigation.visualizationId
    )
    const hasUnappliedChanges = useHasUnappliedChanges()

    const showUnappliedChanges = hasUnappliedChanges && !isVisualizationLoading

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
        <div className={classes.canvas}>
            <div
                className={cx(classes.visualization, {
                    [classes.stale]: showUnappliedChanges,
                })}
            >
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
            <div
                className={cx(classes.notice, {
                    [classes.visible]: showUnappliedChanges,
                })}
                aria-hidden={!showUnappliedChanges}
                data-test="unapplied-changes"
            >
                {i18n.t('Changes not applied')}
            </div>
        </div>
    )
}
