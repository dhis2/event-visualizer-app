import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import type { FC } from 'react'
import { useCallback } from 'react'
import { DownloadMenu } from './download-menu'
import { ViewMenu } from './view-menu'
import { VISUALIZATION_TYPES } from '@constants/visualization-types'
import { FileMenu, HoverMenuBar } from '@dhis2/analytics'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@hooks'
import { isVisualizationSaved } from '@modules/visualization'
import { getCurrentVis } from '@store/current-vis-slice'
import { setNavigationState } from '@store/navigation-slice'
import { getSavedVis } from '@store/saved-vis-slice'
import { tLoadSavedVisualization } from '@store/thunks'

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
            if (isVisualizationSaved(currentVis) && currentVis.id === id) {
                dispatch(tLoadSavedVisualization(id))
            } else {
                dispatch(setNavigationState({ visualizationId: id }))
            }
        },
        [dispatch, currentVis]
    )

    const { show: showAlert } = useAlert(
        ({ message }) => message,
        ({ options }) => options
    )

    const onDelete = () => {
        const deletedVisualization = savedVis.name

        dispatch(setNavigationState({ visualizationId: 'new' }))

        showAlert({
            message: i18n.t('"{{- deletedObject}}" successfully deleted.', {
                deletedObject: deletedVisualization,
            }),
            options: {
                success: true,
                duration: 2000,
            },
        })
    }

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
                // onRename={onRename}
                // onSave={
                //     [STATE_UNSAVED, STATE_DIRTY].includes(
                //         getVisualizationState(visualization, current)
                //     ) &&
                //     isLayoutValidForSave({
                //         ...current,
                //         legacy: visualization?.legacy,
                //     })
                //         ? onSave
                //         : undefined
                // }
                // onSaveAs={
                //     isLayoutValidForSaveAs(current)
                //         ? (details) => onSave(details, true)
                //         : undefined
                // }
                // onShare={onFileMenuAction}
                // onTranslate={onFileMenuAction}
                onDelete={onDelete}
                // onError={onError}
            />
            <ViewMenu />
            <DownloadMenu />
        </HoverMenuBar>
    )
}
