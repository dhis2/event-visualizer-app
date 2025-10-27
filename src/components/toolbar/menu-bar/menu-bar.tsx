import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { useCallback } from 'react'
import type { FC } from 'react'
import { DownloadMenu } from './download-menu'
import { ViewMenu } from './view-menu'
import { parseEngineError } from '@api/parse-engine-error'
import { VISUALIZATION_TYPES } from '@constants/visualization-types'
import { FileMenu, HoverMenuBar } from '@dhis2/analytics'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@hooks'
import {
    isLayoutValidForSave,
    isLayoutValidForSaveAs,
} from '@modules/layout-validation'
import {
    isVisualizationSaved,
    getVisualizationState,
} from '@modules/visualization'
import { getCurrentVis } from '@store/current-vis-slice'
import { setNavigationState } from '@store/navigation-slice'
import { getSavedVis } from '@store/saved-vis-slice'
import {
    tLoadSavedVisualization,
    tCreateVisualization,
    tUpdateVisualization,
    tRenameVisualization,
} from '@store/thunks'

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

    const onSaveAs = async (nameAndDescription: {
        name: string
        description: string
    }) =>
        dispatch(
            tCreateVisualization({
                visualization: currentVis,
                ...nameAndDescription,
                onError,
            })
        )

    const onSave = async () =>
        dispatch(tUpdateVisualization({ visualization: currentVis, onError }))

    const onRename = async ({ name, description }) => {
        try {
            await dispatch(
                tRenameVisualization({
                    id: savedVis.id!,
                    name,
                    description,
                })
            ).unwrap()

            showAlert({
                message: i18n.t('Rename successful'),
                options: {
                    success: true,
                    duration: 2000,
                },
            })
        } catch (error) {
            console.error(error)
            showAlert({
                message: i18n.t('Rename failed'),
                options: {
                    critical: true,
                },
            })
        }
    }

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

    const onDeleteError = (error) => onError(parseEngineError(error))

    const onError = (error) => {
        console.error(error)
        let message = error.message || i18n.t('An unknown error occurred.')

        switch (error.errorCode) {
            case 'E4030':
                message = i18n.t(
                    "This visualization can't be deleted because it is used on one or more dashboards."
                ) // TODO - unable to simulate error E4030
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
                onRename={onRename}
                onSave={
                    ['UNSAVED', 'DIRTY'].includes(
                        getVisualizationState(savedVis, currentVis)
                    ) &&
                    isLayoutValidForSave({
                        ...currentVis,
                        legacy: savedVis?.legacy,
                    })
                        ? onSave
                        : undefined
                }
                onSaveAs={
                    isLayoutValidForSaveAs(currentVis)
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
