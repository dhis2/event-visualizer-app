import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import type { FC } from 'react'
import { DownloadMenu } from './download-menu'
import { OptionsMenu } from './options-menu'
import { ViewMenu } from './view-menu'
import { SUPPORTED_VIS_TYPES } from '@constants/visualization-types'
import {
    FileMenu,
    //    preparePayloadForSaveAs,
    //    preparePayloadForSave,
    HoverMenuBar,
} from '@dhis2/analytics'
import {
    useAppDispatch,
    useAppSelector,
    useCurrentUser,
    useRtkMutation,
    //    useRtkLazyQuery,
} from '@hooks'
import { getAlertTypeByStatusCode } from '@modules/error'
import {
    currentSlice,
    //setCurrent
} from '@store/current-slice'
import { setNavigationState } from '@store/navigation-slice'
import {
    visualizationSlice,
    //    setVisualization,
} from '@store/visualization-slice'
//import { EventVisualization, PickWithFieldFilters } from '@types'
// import {
//DERIVED_USER_SETTINGS_DISPLAY_NAME_PROPERTY,
//    STATE_DIRTY,
//    STATE_UNSAVED,
//    getSaveableVisualization,
//    getVisualizationState,
//} from '@modules/visualization'
//import {
//    isLayoutValidForSave,
//    isLayoutValidForSaveAs,
//} from '@modules/layoutValidation.js'
//import { DERIVED_USER_SETTINGS_DISPLAY_NAME_PROPERTY } from '@modules/userSettings.js'

type MenuBarProps = {
    onFileMenuAction: () => void
}

export const MenuBar: FC<MenuBarProps> = ({ onFileMenuAction }) => {
    const dispatch = useAppDispatch()

    const { getVisualization } = visualizationSlice.selectors
    const { getCurrent } = currentSlice.selectors

    const currentUser = useCurrentUser()
    const current = useAppSelector((state) => getCurrent(state))
    const visualization = useAppSelector((state) => getVisualization(state))

    const filterVisTypes = [
        { type: 'ALL' },
        ...SUPPORTED_VIS_TYPES.map((visType) => ({
            type: visType,
        })),
    ]

    const { show: showAlert } = useAlert(
        ({ message }) => message,
        ({ options }) => options
    )

    //    const fieldsFilter = ['subscribers'] as const
    //    type SubscribersData = PickWithFieldFilters<
    //        EventVisualization,
    //        typeof fieldsFilter
    //    >

    //    const [subscribersQueryTrigger] = useRtkLazyQuery<SubscribersData>()

    const [mutationTrigger] = useRtkMutation()

    const onOpen = (id: string) =>
        dispatch(setNavigationState({ visualizationId: id }))

    const onNew = () => dispatch(setNavigationState({ visualizationId: 'new' }))

    const onDelete = async () => {
        try {
            if (visualization?.id === undefined) {
                throw new Error('Cannot delete without visualization id')
            }

            await mutationTrigger({
                resource: 'eventVisualization',
                id: visualization.id,
                type: 'delete',
            })

            showAlert({
                message: i18n.t('"{{- deletedObject}}" successfully deleted.', {
                    deletedObject: visualization.name,
                }),
                options: {
                    success: true,
                    duration: 2000,
                },
            })

            dispatch(setNavigationState({ visualizationId: 'new' }))
        } catch (err) {
            onError(err)
        }
    }

    const onRename = async ({ name, description }) => {
        /*
        const { eventVisualization } = await apiFetchVisualization({
            engine,
            id: visualization.id,
            nameProp:
                currentUser.settings[
                    DERIVED_USER_SETTINGS_DISPLAY_NAME_PROPERTY
                ],
        })
        const visToSave = await preparePayloadForSave({
            visualization: getSaveableVisualization(eventVisualization),
            name,
            description,
            engine,
        })

        await renameVisualization({ visualization: visToSave })
        const eventVisNameDesc = await apiFetchVisualizationNameDesc({
            engine,
            id: visToSave.id,
        })

        const updatedVisualization = { ...visualization, ...eventVisNameDesc }
        const updatedCurrent = { ...current, ...eventVisNameDesc }

        dispatch(setVisualization(updatedVisualization))

        if (visualization === current) {
            dispatch(setCurrent(updatedVisualization))
        } else {
            dispatch(setCurrent(updatedCurrent))
        }
        */

        showAlert({
            message: `Rename TBD (${name} - ${description})`, //i18n.t('Rename successful'),
            options: {
                success: true,
                duration: 2000,
            },
        })

        onFileMenuAction()
    }

    const onSave = async (
        details: { name?: string; description?: string } = {}
    ) => {
        console.log(`onSave TBD (details: ${details})`)
        //        const { name, description } = details
        //
        //        //            const { subscribers } = await apiFetchVisualizationSubscribers({
        //        //                engine,
        //        //                id: visualization.id,
        //        //            })
        //
        //        try {
        //            if (visualization?.id === undefined) {
        //                throw new Error('Cannot save without a visualization id')
        //            }
        //
        //            const subscribersData = await subscribersQueryTrigger({
        //                resource: 'eventVisualizations',
        //                id: visualization.id,
        //                params: {
        //                    fields: fieldsFilter.toString(),
        //                },
        //            })
        //
        //            const mutationResponse = await mutationTrigger({
        //                resource: 'eventVisualizations',
        //                type: 'update',
        //                id: visualization.id,
        //                data: {
        //                    // TODO
        //                    visualization: preparePayloadForSave({
        //                        visualization: {
        //                            ...getSaveableVisualization(current),
        //                            subscribersData,
        //                        },
        //                        name,
        //                        description,
        //                        engine,
        //                    }),
        //                    params: {
        //                        skipTranslations: true,
        //                        skipSharing: true,
        //                    },
        //                },
        //            }).unwrap()
        //
        //            onSaveComplete(mutationResponse)
        //        } catch (err) {
        //            onError(err)
        //        }
    }

    const onSaveAs = (
        details: { name?: string; description?: string } = {}
    ) => {
        console.log(`onSaveAs TBD (details: ${details})`)
        //        const { name, description } = details
        //        // remove property subscribers before saving as new
        //        // eslint-disable-next-line no-unused-vars
        //        const { subscribers, ...currentWithoutSubscribers } = current
        //
        //        mutationTrigger({
        //            resource: 'eventVisualizations',
        //            type: 'create',
        //            data: {
        //                visualization: preparePayloadForSaveAs({
        //                    visualization: getSaveableVisualization(
        //                        currentWithoutSubscribers
        //                    ),
        //                    name,
        //                    description,
        //                }),
        //            },
        //            params: {
        //                skipTranslations: true,
        //                skipSharing: true,
        //            },
        //        })
    }

    //    const onSaveComplete = (res) => {
    //        if (res.response.uid) {
    //            dispatch(setNavigationState({ visualizationId: res.response.uid }))
    //        }
    //    }

    const onError = (error) => {
        console.error('Error:', error)

        const message =
            error.errorCode === 'E4030'
                ? i18n.t(
                      "This visualization can't be deleted because it is used on one or more dashboards"
                  )
                : error.message

        showAlert({
            message,
            options: {
                [getAlertTypeByStatusCode(error.httpStatusCode)]: true,
            },
        })
    }

    return (
        <HoverMenuBar>
            <FileMenu
                currentUser={currentUser}
                fileType={'eventVisualization'}
                fileObject={{
                    ...visualization,
                    ...current,
                }}
                filterVisTypes={filterVisTypes}
                defaultFilterVisType={'ALL'}
                onOpen={onOpen}
                onNew={onNew}
                onRename={onRename}
                onSave={onSave} // TODO disable based on dirty state
                //                onSave={
                //                    [STATE_UNSAVED, STATE_DIRTY].includes(
                //                        getVisualizationState(visualization, current)
                //                    ) &&
                //                    isLayoutValidForSave({
                //                        ...current,
                //                        legacy: visualization?.legacy,
                //                    })
                //                        ? onSave
                //                        : undefined
                //                }
                onSaveAs={onSaveAs}
                //                onSaveAs={
                //                    isLayoutValidForSaveAs(current)
                //                        ? (details) => onSave(details, true)
                //                        : undefined
                //                }
                onShare={onFileMenuAction}
                onTranslate={onFileMenuAction}
                onDelete={onDelete}
                onError={onError}
            />
            <ViewMenu />
            <OptionsMenu />
            <DownloadMenu />
        </HoverMenuBar>
    )
}
