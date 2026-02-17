import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { SharingDialog } from '@dhis2/ui'
import { useCallback, useMemo, useState, type FC } from 'react'
import { DownloadMenu } from './download-menu'
import { FileMenu } from './file-menu'
import { NewButton } from './new-button'
import { OpenButton } from './open-button'
import { SaveButton } from './save-button'
import classes from './styles/actions-bar.module.css'
import { useToolbarActions } from './use-toolbar-actions'
import { ViewMenu } from './view-menu'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import { parseEngineError } from '@api/parse-engine-error'
import { ToolbarDivider } from '@components/toolbar/toolbar-divider'
import { VISUALIZATION_TYPES } from '@constants/visualization-types'
import {
    DeleteDialog,
    GetLinkDialog,
    HoverMenuBar,
    OpenFileDialog,
    RenameDialog,
    SaveAsDialog,
    TranslationDialog,
} from '@dhis2/analytics'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@hooks'
import { isVisualizationValidForSaveAs } from '@modules/validation'
import {
    getCurrentVis,
    setCurrentVisNameDescription,
} from '@store/current-vis-slice'
import { setNavigationState } from '@store/navigation-slice'
import { getSavedVis, setSavedVisNameDescription } from '@store/saved-vis-slice'
import type { SavedVisualization } from '@types'

export const ActionsBar: FC = () => {
    const dispatch = useAppDispatch()

    const [currentDialog, setCurrentDialog] = useState<string | null>(null)

    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const savedVis = useAppSelector(getSavedVis)

    const fileObject = useMemo(
        () => ({ ...savedVis, ...currentVis } as SavedVisualization),
        [currentVis, savedVis]
    )

    const fileType = 'eventVisualization'

    const filterVisTypes = [
        { type: 'ALL', insertDivider: true },
        ...VISUALIZATION_TYPES.map((visType) => ({
            type: visType,
        })),
    ]

    const isOnSaveAsEnabled = useMemo(
        () => isVisualizationValidForSaveAs(currentVis),
        [currentVis]
    )

    const onMenuItemClick = (dialogToOpen) => {
        setCurrentDialog(dialogToOpen)
    }

    const onDialogClose = () => setCurrentDialog(null)

    const { onError, onNew, onOpen, onSaveAs } = useToolbarActions()

    const { show: showAlert } = useAlert(
        ({ message }) => message,
        ({ options }) => options
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

    const onDeleteConfirm = () => {
        // The dialog must be closed before calling the callback
        // otherwise the currentVis is changed to null before the
        // dialog is closed causing a crash in renderDialog() below
        // due to currentVis.id not being available
        onDialogClose()
        onDelete()
    }

    const onDeleteError = (error) => onError(parseEngineError(error))

    const renderDialog = () => {
        switch (currentDialog) {
            case 'rename':
                return (
                    <RenameDialog
                        type={fileType}
                        object={fileObject}
                        onClose={onDialogClose}
                        onRename={onRename}
                    />
                )
            case 'translate':
                return (
                    <TranslationDialog
                        objectToTranslate={fileObject}
                        fieldsToTranslate={['name', 'description']}
                        onClose={onDialogClose}
                        onTranslationSaved={() => {
                            onDialogClose()
                        }}
                    />
                )
            case 'sharing':
                return (
                    <SharingDialog
                        type={fileType}
                        id={fileObject.id}
                        onClose={onDialogClose}
                    />
                )
            case 'getlink':
                return (
                    <GetLinkDialog
                        type={fileType}
                        id={fileObject.id}
                        onClose={onDialogClose}
                    />
                )
            case 'delete':
                return (
                    <DeleteDialog
                        type={fileType}
                        id={fileObject.id}
                        onDelete={onDeleteConfirm}
                        onError={onDeleteError}
                        onClose={onDialogClose}
                    />
                )
            case 'saveas':
                return (
                    <SaveAsDialog
                        type={fileType}
                        object={fileObject}
                        onSaveAs={isOnSaveAsEnabled ? onSaveAs : undefined}
                        onClose={onDialogClose}
                    />
                )
            default:
                return null
        }
    }

    return (
        <>
            <OpenFileDialog
                open={currentDialog === 'open'}
                type={fileType}
                filterVisTypes={filterVisTypes}
                defaultFilterVisType="ALL"
                onClose={onDialogClose}
                onFileSelect={(id) => {
                    onOpen(id)
                    onDialogClose()
                }}
                onNew={onNew}
                currentUser={currentUser}
            />
            <div
                style={{ display: 'flex', flexGrow: 0, alignItems: 'stretch' }}
            >
                <div className={classes.actionButtons}>
                    <NewButton />
                    <OpenButton onClick={() => onMenuItemClick('open')} />
                    <SaveButton />
                    <ToolbarDivider />
                </div>
                <HoverMenuBar>
                    <FileMenu onMenuItemClick={onMenuItemClick} />
                    <ViewMenu />
                    <DownloadMenu />
                </HoverMenuBar>
            </div>
            {renderDialog()}
        </>
    )
}
