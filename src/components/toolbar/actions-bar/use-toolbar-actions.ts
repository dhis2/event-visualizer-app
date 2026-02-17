import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { useCallback } from 'react'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import {
    preparePayloadForSave,
    preparePayloadForSaveAs,
} from '@dhis2/analytics'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    getSaveableVisualization,
    isVisualizationSaved,
} from '@modules/visualization'
import { getCurrentVis } from '@store/current-vis-slice'
import { setNavigationState } from '@store/navigation-slice'
import { tLoadSavedVisualization } from '@store/thunks'
import type { NewVisualization, SavedVisualization } from '@types'

export const useToolbarActions = () => {
    const dispatch = useAppDispatch()

    const currentVis = useAppSelector(getCurrentVis)

    const { show: showAlert } = useAlert(
        ({ message }) => message,
        ({ options }) => options
    )

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
        onError,
        onOpen,
        onNew,
        onSave,
        onSaveAs,
    }
}
