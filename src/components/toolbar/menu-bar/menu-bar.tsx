import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { useCallback } from 'react'
import type { FC } from 'react'
import { DownloadMenu } from './download-menu'
import { ViewMenu } from './view-menu'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import { parseEngineError } from '@api/parse-engine-error'
import { useToolbarActions } from '@components/toolbar/use-toolbar-actions'
import { VISUALIZATION_TYPES } from '@constants/visualization-types'
import { FileMenu, HoverMenuBar } from '@dhis2/analytics'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@hooks'
import {
    isVisualizationValidForSave,
    isVisualizationValidForSaveAs,
} from '@modules/validation'
import { getVisualizationState } from '@modules/visualization'
import {
    getCurrentVis,
    setCurrentVisNameDescription,
} from '@store/current-vis-slice'
import { setNavigationState } from '@store/navigation-slice'
import { getSavedVis, setSavedVisNameDescription } from '@store/saved-vis-slice'

export const MenuBar: FC = () => {
    const dispatch = useAppDispatch()

    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const savedVis = useAppSelector(getSavedVis)

    const { onError, onNew, onOpen, onSave, onSaveAs } = useToolbarActions()

    const { show: showAlert } = useAlert(
        ({ message }) => message,
        ({ options }) => options
    )

    const filterVisTypes = [
        { type: 'ALL', insertDivider: true },
        ...VISUALIZATION_TYPES.map((visType) => ({
            type: visType,
        })),
    ]

    // Existing visualization
    // the visualization is updated with only name and/or description from the rename dialog
    const onRename = useCallback(
        async ({ name, description }) => {
            const { data, error } = await dispatch(
                eventVisualizationsApi.endpoints.renameVisualization.initiate({
                    name,
                    description,
                })
            )

            if (data) {
                // Update current and visualization with edited name/description
                dispatch(setCurrentVisNameDescription(data))
                dispatch(setSavedVisNameDescription(data))

                showAlert({
                    message: i18n.t('Rename successful'),
                    options: {
                        success: true,
                        duration: 2000,
                    },
                })
            } else if (error) {
                showAlert({
                    message: i18n.t('Rename failed'),
                    options: {
                        critical: true,
                    },
                })
            }
        },
        [dispatch, showAlert]
    )

    const onDelete = useCallback(() => {
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
    }, [dispatch, savedVis.name, showAlert])

    const onDeleteError = (error) => onError(parseEngineError(error))

    return (
        <div style={{ display: 'flex', flexGrow: 0, alignItems: 'stretch' }}>
            <HoverMenuBar>
                <FileMenu
                    currentUser={currentUser}
                    fileObject={{ ...savedVis, ...currentVis }}
                    fileType="eventVisualization"
                    filterVisTypes={filterVisTypes}
                    defaultFilterVisType="ALL"
                    onNew={onNew}
                    onOpen={onOpen}
                    // TODO: perhaps disable with a dirty visualization as the changes are lost and it's not transparent
                    // needs a change in the analytics component
                    onRename={onRename}
                    onSave={
                        ['UNSAVED', 'DIRTY'].includes(
                            getVisualizationState(savedVis, currentVis)
                        ) &&
                        isVisualizationValidForSave({
                            ...currentVis,
                            legacy: savedVis?.legacy,
                        })
                            ? onSave
                            : undefined
                    }
                    onSaveAs={
                        isVisualizationValidForSaveAs(currentVis)
                            ? (nameAndDescription) =>
                                  onSaveAs(nameAndDescription)
                            : undefined
                    }
                    onDelete={onDelete}
                    onError={onDeleteError}
                />
                <ViewMenu />
                <DownloadMenu />
            </HoverMenuBar>
        </div>
    )
}
