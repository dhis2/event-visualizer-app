import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { useCallback } from 'react'
import type { FC } from 'react'
import { DownloadMenu } from './download-menu'
import { ViewMenu } from './view-menu'
import { VISUALIZATION_TYPES } from '@constants/visualization-types'
import {
    FileMenu,
    HoverMenuBar,
    // preparePayloadForSave,
    preparePayloadForSaveAs,
} from '@dhis2/analytics'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@hooks'
import { isLayoutValidForSaveAs } from '@modules/layout-validation'
import {
    getSaveableVisualization,
    isVisualizationSaved,
} from '@modules/visualization'
import { getCurrentVis } from '@store/current-vis-slice'
import { setNavigationState } from '@store/navigation-slice'
import { getSavedVis } from '@store/saved-vis-slice'
import { tLoadSavedVisualization, tCreateVisualization } from '@store/thunks'

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

    const onSave = async (
        nameAndDescription: { name?: string; description?: string } = {},
        copy: boolean = false
    ) => {
        const { name, description } = nameAndDescription
        const vis = preparePayloadForSaveAs({
            visualization: {
                ...getSaveableVisualization(currentVis),
                subscribers: undefined,
            },
            name,
            description,
        })

        if (copy) {
            dispatch(tCreateVisualization(vis))
        }
        // else {
        //     const { subscribers } = await apiFetchVisualizationSubscribers({
        //         engine,
        //         id: visualization.id,
        //     })

        //     putVisualization({
        //         visualization: await preparePayloadForSave({
        //             visualization: {
        //                 ...getSaveableVisualization(currentVis),
        //                 subscribers,
        //             },
        //             name,
        //             description,
        //         }),
        //     })
        // }
    }

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
                onSaveAs={
                    isLayoutValidForSaveAs(currentVis)
                        ? (nameAndDescription) =>
                              onSave(nameAndDescription, true)
                        : undefined
                }
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
