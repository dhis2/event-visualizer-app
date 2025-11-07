import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { useCallback } from 'react'
import type { FC } from 'react'
import { DownloadMenu } from './download-menu'
import { ViewMenu } from './view-menu'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import { parseEngineError } from '@api/parse-engine-error'
import { VISUALIZATION_TYPES } from '@constants/visualization-types'
import {
    FileMenu,
    HoverMenuBar,
    preparePayloadForSave,
    preparePayloadForSaveAs,
} from '@dhis2/analytics'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@hooks'
import {
    getVisualizationState,
    getSaveableVisualization,
    isVisualizationSaved,
    isVisualizationValidForSave,
    isVisualizationValidForSaveAs,
} from '@modules/visualization'
import {
    getCurrentVis,
    setCurrentVisNameDescription,
} from '@store/current-vis-slice'
import { setNavigationState } from '@store/navigation-slice'
import { getSavedVis, setSavedVisNameDescription } from '@store/saved-vis-slice'
import { tLoadSavedVisualization } from '@store/thunks'
import type { NewVisualization, SavedVisualization } from '@types'

export const MenuBar: FC = () => {
    const dispatch = useAppDispatch()

    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const savedVis = useAppSelector(getSavedVis)

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

    const onError = useCallback(
        (error) => {
            console.error(error)
            let message = error.message || i18n.t('An unknown error occurred.')

            switch (error.errorCode) {
                case 'E4030':
                    message = i18n.t(
                        "This visualization can't be deleted because it is used on one or more dashboards."
                    ) // TODO: - unable to simulate error E4030
                    break
                case 'E1006':
                    message = i18n.t("You don't have sufficient permissions.")
                    break
                default:
                    break
            }

            const alertLevel = /50\d/.test(String(error.httpStatusCode))
                ? 'error'
                : 'warning'

            showAlert({
                message,
                options: {
                    [alertLevel]: true,
                },
            })
        },
        [showAlert]
    )

    const onNew = useCallback(
        () => dispatch(setNavigationState({ visualizationId: 'new' })),
        [dispatch]
    )

    const onOpen = useCallback(
        (id: string) => {
            if (isVisualizationSaved(currentVis) && currentVis.id === id) {
                dispatch(
                    tLoadSavedVisualization({ id, updateStatistics: false })
                )
            } else {
                dispatch(setNavigationState({ visualizationId: id }))
            }
        },
        [dispatch, currentVis]
    )

    // New visualization
    // it can be a copy of an existing one, but a new id is returned
    const onSaveAs = useCallback(
        async (nameAndDescription: { name: string; description: string }) => {
            const { data, error } = await dispatch(
                eventVisualizationsApi.endpoints.createVisualization.initiate(
                    preparePayloadForSaveAs({
                        visualization: {
                            ...getSaveableVisualization(
                                currentVis as unknown as NewVisualization
                            ),
                            // XXX: this ideally should be done in preparePayloadForSaveAs
                            subscribers: [],
                        },
                        ...nameAndDescription,
                    })
                )
            )

            if (data) {
                // Navigate to the new visualization
                dispatch(setNavigationState({ visualizationId: data }))
            } else if (error) {
                onError(error)
            }
        },
        [dispatch, currentVis, onError]
    )

    // Existing visualization
    const onSave = useCallback(async () => {
        const { data, error } = await dispatch(
            eventVisualizationsApi.endpoints.updateVisualization.initiate(
                preparePayloadForSave({
                    visualization: getSaveableVisualization(
                        currentVis as unknown as SavedVisualization
                    ) as SavedVisualization,
                })
            )
        )

        if (data) {
            // Reload the saved visualization after saving
            // here we should *not* update statistics
            dispatch(
                tLoadSavedVisualization({
                    id: currentVis.id,
                    updateStatistics: false,
                })
            )
        } else if (error) {
            onError(error)
        }
    }, [dispatch, currentVis, onError])

    // Existing visualization
    // but the only changes are name and/or description
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
        <HoverMenuBar>
            <FileMenu
                currentUser={currentUser}
                fileObject={{ ...savedVis, ...currentVis }}
                fileType="eventVisualization"
                filterVisTypes={filterVisTypes}
                defaultFilterVisType="ALL"
                onNew={onNew}
                onOpen={onOpen}
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
                        ? (nameAndDescription) => onSaveAs(nameAndDescription)
                        : undefined
                }
                onDelete={onDelete}
                onError={onDeleteError}
            />
            <ViewMenu />
            <DownloadMenu />
        </HoverMenuBar>
    )
}
