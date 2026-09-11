import { useLoadVisualizationOnMount } from '@components/app/use-load-visualization-on-mount'
import type { ColumnHeaderClickFn } from '@components/line-list/types'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@hooks'
import { isVisualizationEmpty } from '@modules/visualization/state'
import { getCurrentVis, setCurrentVis } from '@store/current-vis-slice'
import {
    getIsVisualizationLoading,
    getVisualizationLoadError,
} from '@store/loader-slice'
import type { Sorting } from '@types'
import { useCallback, type FC } from 'react'

type VisualizationTestHostProps = {
    isInDashboard?: boolean
    isInModal?: boolean
    onColumnHeaderClick?: ColumnHeaderClickFn
}

/* Runs the real load-and-render pipeline the way app.tsx + Canvas do: load
 * the visualization the navigation state points at (which also seeds the
 * metadata store), then hand the loaded state to PluginWrapper. */
export const VisualizationTestHost: FC<VisualizationTestHostProps> = (
    props
) => {
    useLoadVisualizationOnMount()
    const dispatch = useAppDispatch()
    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)
    const visualizationLoadError = useAppSelector(getVisualizationLoadError)

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

    return (
        <PluginWrapper
            visualization={currentVis}
            isVisualizationLoading={isVisualizationLoading}
            visualizationLoadError={visualizationLoadError ?? undefined}
            displayProperty={currentUser.settings.displayProperty}
            onDataSorted={onDataSorted}
            {...props}
        />
    )
}
