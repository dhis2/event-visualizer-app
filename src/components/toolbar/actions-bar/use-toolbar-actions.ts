import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { useCallback, useMemo } from 'react'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import {
    preparePayloadForSave,
    preparePayloadForSaveAs,
} from '@dhis2/analytics'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    isVisualizationValidForSave,
    isVisualizationValidForSaveAs,
} from '@modules/validation'
import {
    isVisualizationValidForSave,
    isVisualizationValidForSaveAs,
} from '@modules/validation'
import {
    getSaveableVisualization,
    getVisualizationState,
    isVisualizationSaved,
} from '@modules/visualization'
import {
    getCurrentVis,
    setCurrentVisNameDescription,
} from '@store/current-vis-slice'
import { setNavigationState } from '@store/navigation-slice'
import { getSavedVis, setSavedVisNameDescription } from '@store/saved-vis-slice'
import { tLoadSavedVisualization } from '@store/thunks'
import type { NewVisualization, SavedVisualization } from '@types'

export const useToolbarActions = () => {
    const dispatch = useAppDispatch()

    const currentVis = useAppSelector(getCurrentVis)
    const savedVis = useAppSelector(getSavedVis)

    const { show: showAlert } = useAlert(
        ({ message }) => message,
        ({ options }) => options
    )

    const isSaveEnabled = useMemo(
        () =>
            ['UNSAVED', 'DIRTY'].includes(
                getVisualizationState(savedVis, currentVis)
            ) &&
            isVisualizationValidForSave({
                ...currentVis,
                legacy: savedVis?.legacy,
            }) &&
            (!('id' in currentVis) || currentVis.access?.update),
        [currentVis, savedVis]
    )

    const isSaveAsEnabled = useMemo(
        () => isVisualizationValidForSaveAs(currentVis),
        [currentVis]
    )

    const onDelete = useCallback(() => {
        dispatch(setNavigationState({ visualizationId: 'new' }))

        showAlert({
            message: i18n.t('"{{- deletedObject}}" successfully deleted.', {
                deletedObject: savedVis.name,
            }),
            options: {
                success: true,
                duration: 2000,
            },
        })
    }, [dispatch, savedVis.name, showAlert])

    const onError = useCallback(
        (error) => {
            console.error(error)
            let message = error.message || i18n.t('An unknown error occurred.')

            switch (error.errorCode) {
                case 'E4030':
                    message = i18n.t(
                        "This visualization can't be deleted because it is used on one or more dashboards."
                    )
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

        if (data && isVisualizationSaved(currentVis)) {
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

    return {
        isSaveEnabled,
        isSaveAsEnabled,
        onDelete,
        onError,
        onOpen,
        onNew,
        onRename,
        onSave,
        onSaveAs,
    }
}
