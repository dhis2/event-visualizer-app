import type { FC } from 'react'
import { useCallback } from 'react'
import { DownloadMenu } from './download-menu'
import { ViewMenu } from './view-menu'
import { VISUALIZATION_TYPES } from '@constants/visualization-types'
import { FileMenu, HoverMenuBar } from '@dhis2/analytics'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@hooks'
import { getCurrentVis } from '@store/current-vis-slice'
import { setNavigationState } from '@store/navigation-slice'
import { getSavedVis } from '@store/saved-vis-slice'

export const MenuBar: FC = () => {
    const dispatch = useAppDispatch()

    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const savedVis = useAppSelector(getSavedVis)

    const filterVisTypes = [
        { type: 'ALL', insertDivider: true },
        ...VISUALIZATION_TYPES.map((visType) => ({
            type: visType,
        })),
    ]

    const onNew = useCallback(
        () => dispatch(setNavigationState({ visualizationId: 'new' })),
        [dispatch]
    )

    const onOpen = useCallback(
        (id: string) => {
            dispatch(setNavigationState({ visualizationId: id }))
        },
        [dispatch]
    )

    return (
        <HoverMenuBar>
            <FileMenu
                currentUser={currentUser}
                fileObject={{ ...savedVis, ...currentVis }}
                fileType="eventVisualization"
                filterVisTypes={filterVisTypes}
                defaultFilterVisType="ALL"
                onNew={onNew}
                onOpen={onOpen}
            />
            <ViewMenu />
            <DownloadMenu />
        </HoverMenuBar>
    )
}
