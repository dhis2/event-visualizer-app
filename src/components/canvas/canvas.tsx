import { useHasUnappliedChanges } from '@components/layout-panel/bottom-bar/use-has-unapplied-changes'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { StartScreen } from '@components/start-screen/start-screen'
import { IconInfo16, Tooltip } from '@dhis2/ui'
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
            <Tooltip content="Not updated with layout changes">
                {(tooltipProps: object) => (
                    <div
                        {...tooltipProps}
                        style={{
                            position: 'absolute',
                            top: -3,
                            left: 4,
                            display: 'flex',
                            padding: ' 4px',
                            borderRadius: '4px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--colors-grey100)',
                            boxShadow:
                                '0 0 0 1px var(--colors-grey400), 0 1px 5px rgba(12, 12, 12, 0.05), 0 0 40px rgba(12, 12, 12, 0.015)',

                            zIndex: 1,
                            opacity: hasUnappliedChanges ? 0.9 : 0,
                            pointerEvents: hasUnappliedChanges
                                ? 'auto'
                                : 'none',
                            transition:
                                'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        <IconInfo16 color="var(--colors-grey800)" />
                    </div>
                )}
            </Tooltip>
        </div>
    )
}
