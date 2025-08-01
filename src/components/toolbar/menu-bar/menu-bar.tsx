import {
    VIS_TYPE_GROUP_ALL,
    //useCachedDataQuery,
    FileMenu,
    //    preparePayloadForSaveAs,
    //    preparePayloadForSave,
    HoverMenuBar,
} from '@dhis2/analytics'
import {
    useAlert /*, useDataMutation, useDataEngine*/,
} from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import React, { FC } from 'react'
//import { useSelector, useDispatch } from 'react-redux'
//import { tSetCurrent } from '../../actions/current.js'
//import { acSetVisualization } from '../../actions/visualization.js'
//import {
//    apiFetchVisualization,
//    apiFetchVisualizationNameDesc,
//    apiFetchVisualizationSubscribers,
//} from '../../api/visualization.js'
import { getAlertTypeByStatusCode } from '../../../modules/error'
import { history } from '../../../modules/history'
//import {
//    isLayoutValidForSave,
//    isLayoutValidForSaveAs,
//} from '../../modules/layoutValidation.js'
//import { DERIVED_USER_SETTINGS_DISPLAY_NAME_PROPERTY } from '../../modules/userSettings.js'
import {
    visTypes,
    useVisTypesFilterByVersion,
    //    STATE_DIRTY,
    //    STATE_UNSAVED,
    //    getSaveableVisualization,
    //    getVisualizationState,
} from '../../../modules/visualization'
//import { sGetCurrent } from '../../reducers/current.js'
//import { sGetVisualization } from '../../reducers/visualization.js'
//import { ToolbarDownloadDropdown } from '../DownloadMenu/index.js'
//import VisualizationOptionsManager from '../VisualizationOptions/VisualizationOptionsManager.jsx'
import DownloadMenu from './download-menu'
import OptionsMenu from './options-menu'
import ViewMenu from './view-menu'

//const visualizationSaveAsMutation = {
//    type: 'create',
//    resource: 'eventVisualizations',
//    data: ({ visualization }) => visualization,
//    params: {
//        skipTranslations: true,
//        skipSharing: true,
//    },
//}
//
//const visualizationSaveMutation = {
//    type: 'update',
//    resource: 'eventVisualizations',
//    id: ({ visualization }) => visualization.id,
//    data: ({ visualization }) => visualization,
//    params: {
//        skipTranslations: true,
//        skipSharing: true,
//    },
//}

type MenuBarProps = {
    onFileMenuAction: () => void
}

const MenuBar: FC<MenuBarProps> = ({ onFileMenuAction }) => {
    //    const dispatch = useDispatch()
    //    const engine = useDataEngine()
    //    const { currentUser } = useCachedDataQuery()
    const currentUser = { id: 'test-id', name: 'placeholder user' }
    //    const current = useSelector(sGetCurrent)
    //    const visualization = useSelector(sGetVisualization)
    const filterVisTypesByVersion = useVisTypesFilterByVersion()

    const filterVisTypes = [
        { type: VIS_TYPE_GROUP_ALL },
        ...visTypes.filter(filterVisTypesByVersion).map((visType) => ({
            type: visType,
        })),
    ]

    const { show: showAlert } = useAlert(
        ({ message }) => message,
        ({ options }) => options
    )

    //    const setCurrent = useCallback(
    //        (visualization) => {
    //            dispatch(tSetCurrent(visualization))
    //        },
    //        [dispatch]
    //    )
    //
    //    const setVisualization = useCallback(
    //        (visualization) => {
    //            dispatch(acSetVisualization(visualization))
    //        },
    //        [dispatch]
    //    )

    const onOpen = (id) => {
        const path = `/${id}`
        if (history.location.pathname === path) {
            history.replace({ pathname: path }, { isOpening: true })
        } else {
            history.push(path)
        }
    }

    const onNew = () => {
        if (history.location.pathname === '/') {
            history.replace({ pathname: '/' }, { isResetting: true })
        } else {
            history.push('/')
        }
    }

    const onDelete = () => {
        const deletedVisualization = 'TBD' //visualization?.name

        history.push('/')

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

        setVisualization(updatedVisualization)

        if (visualization === current) {
            setCurrent(updatedVisualization)
        } else {
            setCurrent(updatedCurrent)
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

    //    const onSave = async (details = {}, copy = false) => {
    //        const { name, description } = details
    //
    //        if (copy) {
    //            // remove property subscribers before saving as new
    //            // eslint-disable-next-line no-unused-vars
    //            const { subscribers, ...currentWithoutSubscribers } = current
    //
    //            postVisualization({
    //                visualization: preparePayloadForSaveAs({
    //                    visualization: getSaveableVisualization(
    //                        currentWithoutSubscribers
    //                    ),
    //                    name,
    //                    description,
    //                }),
    //            })
    //        } else {
    //            const { subscribers } = await apiFetchVisualizationSubscribers({
    //                engine,
    //                id: visualization.id,
    //            })
    //
    //            putVisualization({
    //                visualization: await preparePayloadForSave({
    //                    visualization: {
    //                        ...getSaveableVisualization(current),
    //                        subscribers,
    //                    },
    //                    name,
    //                    description,
    //                    engine,
    //                }),
    //            })
    //        }
    //    }

    //    const onSaveComplete = (res, copy = false) => {
    //        if (res.response.uid) {
    //            const locationObject = {
    //                pathname: `/${res.response.uid}`,
    //            }
    //
    //            const locationState = {
    //                isSaving: true,
    //            }
    //
    //            // Save As
    //            if (copy) {
    //                history.push(locationObject, locationState)
    //            }
    //            // Save
    //            else {
    //                history.replace(locationObject, locationState)
    //            }
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

    //    const [postVisualization] = useDataMutation(visualizationSaveAsMutation, {
    //        onComplete: onSaveComplete,
    //        onError,
    //    })
    //    const [putVisualization] = useDataMutation(visualizationSaveMutation, {
    //        onComplete: (res) => onSaveComplete(res, true),
    //        onError,
    //    })
    //
    //    const [renameVisualization] = useDataMutation(visualizationSaveMutation, {
    //        onError: () => onError({ message: i18n.t('Rename failed') }),
    //    })

    return (
        <HoverMenuBar>
            <FileMenu
                currentUser={currentUser}
                fileType={'eventVisualization'}
                //               fileObject={{
                //                   ...visualization,
                //                   ...current,
                //               }}
                filterVisTypes={filterVisTypes}
                defaultFilterVisType={VIS_TYPE_GROUP_ALL}
                onOpen={onOpen}
                onNew={onNew}
                onRename={onRename}
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

export default MenuBar
