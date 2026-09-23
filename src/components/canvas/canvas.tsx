import { useHasUnappliedChanges } from '@components/layout-panel/bottom-bar/use-has-unapplied-changes'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { StartScreen } from '@components/start-screen/start-screen'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@hooks'
import { isVisualizationEmpty } from '@modules/visualization/guards'
import { getCurrentVis, setCurrentVis } from '@store/current-vis-slice'
import {
    getIsVisualizationLoading,
    getVisualizationLoadError,
} from '@store/loader-slice'
import { tLoadSavedVisualization } from '@store/thunks'
import { setUiActiveDimensionModal } from '@store/ui-slice'
import type { Sorting } from '@types'
import { useCallback, type FC } from 'react'

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
        <div style={{ position: 'relative', height: '100%' }}>
            <div
                style={{
                    opacity: hasUnappliedChanges ? 0.66 : 1,

                    height: '100%',
                    transition:
                        'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1), filter 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
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
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 4,
                    right: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    background:
                        'linear-gradient(180deg, var(--colors-grey300) 0%, var(--colors-grey300) 72%, transparent 100%)',
                    zIndex: 1,
                    padding: '1px 8px 8px',
                    opacity: hasUnappliedChanges ? 0.9 : 0,
                    pointerEvents: 'none',
                    transition: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                <span
                    style={{
                        fontSize: 12,
                        color: 'var(--colors-grey700)',
                        letterSpacing: '0.01em',
                        lineHeight: '16px',
                    }}
                >
                    Changes not applied
                </span>
            </div>
        </div>
    )
}
