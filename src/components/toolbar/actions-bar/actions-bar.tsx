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
import { SharingDialog } from '@dhis2/ui'
import { useAppSelector, useCurrentUser } from '@hooks'
import {
    isCurrentVisualizationPersisted,
    isVisualizationPersistable,
} from '@modules/visualization/state'
import { getCurrentVis } from '@store/current-vis-slice'
import { getSavedVis } from '@store/saved-vis-slice'
import type { SavedVisualization } from '@types'
import { useMemo, useState, type FC } from 'react'
import { DownloadMenu } from './download-menu'
import { FileMenu } from './file-menu'
import { NewButton } from './new-button'
import { OpenButton } from './open-button'
import { SaveButton } from './save-button'
import classes from './styles/actions-bar.module.css'
import { useToolbarActions } from './use-toolbar-actions'
import { ViewMenu } from './view-menu'

const FILE_TYPE = 'eventVisualization'

const FILTER_VIS_TYPES = [
    { type: 'ALL', insertDivider: true },
    ...VISUALIZATION_TYPES.map((visType) => ({
        type: visType,
    })),
]

type ActionsBarDialogProps = {
    currentDialog: string | null
    onClose: () => void
}

const ActionsBarDialog: FC<ActionsBarDialogProps> = ({
    currentDialog,
    onClose,
}) => {
    const currentVis = useAppSelector(getCurrentVis)
    const savedVis = useAppSelector(getSavedVis)

    // Cast is safe: only consumed when a dialog is open, by which point the
    // relevant slices are populated (file-menu disables items otherwise).
    const fileObject = useMemo(
        () => ({ ...savedVis, ...currentVis }) as SavedVisualization,
        [currentVis, savedVis]
    )

    // The SaveAs dialog is also opened from the Save button for brand-new
    // (UNSAVED) visualizations, so this gate must only check persistability
    // and not require a savedVis.
    const isOnSaveAsEnabled = useMemo(
        () => isVisualizationPersistable(currentVis),
        [currentVis]
    )

    const { onDelete, onError, onRename, onSaveAs } = useToolbarActions()

    const onDeleteConfirm = () => {
        // The dialog must be closed before calling the callback
        // otherwise the currentVis is changed to null before the
        // dialog is closed causing a crash in the delete switch case below
        // due to fileObject.id not being available
        onClose()
        onDelete()
    }

    const onDeleteError = (error: unknown) => onError(parseEngineError(error))

    switch (currentDialog) {
        case 'rename':
            return (
                <RenameDialog
                    type={FILE_TYPE}
                    object={fileObject}
                    onClose={onClose}
                    onRename={onRename}
                />
            )
        case 'translate':
            return (
                <TranslationDialog
                    objectToTranslate={fileObject}
                    fieldsToTranslate={['name', 'description']}
                    onClose={onClose}
                    onTranslationSaved={() => {
                        onClose()
                    }}
                />
            )
        case 'sharing':
            return (
                <SharingDialog
                    type={FILE_TYPE}
                    id={fileObject.id}
                    onClose={onClose}
                />
            )
        case 'getlink':
            return (
                <GetLinkDialog
                    type={FILE_TYPE}
                    id={fileObject.id}
                    onClose={onClose}
                />
            )
        case 'delete':
            return (
                <DeleteDialog
                    type={FILE_TYPE}
                    id={fileObject.id}
                    onDelete={onDeleteConfirm}
                    onError={onDeleteError}
                    onClose={onClose}
                />
            )
        case 'saveas':
            return (
                <SaveAsDialog
                    type={FILE_TYPE}
                    object={fileObject}
                    onSaveAs={isOnSaveAsEnabled ? onSaveAs : undefined}
                    onClose={onClose}
                />
            )
        default:
            return null
    }
}

export const ActionsBar: FC = () => {
    const [currentDialog, setCurrentDialog] = useState<string | null>(null)

    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)

    const onMenuItemClick = (dialogToOpen: string) => {
        setCurrentDialog(dialogToOpen)
    }

    const onDialogClose = () => setCurrentDialog(null)

    const { onNew, onOpen, onSave } = useToolbarActions()

    const onSaveOrSaveAs = isCurrentVisualizationPersisted(currentVis)
        ? onSave
        : () => setCurrentDialog('saveas')

    return (
        <>
            <div className={classes.actionsBar}>
                <div className={classes.actionButtons}>
                    <NewButton />
                    <OpenButton onClick={() => onMenuItemClick('open')} />
                    <SaveButton onClick={onSaveOrSaveAs} />
                    <ToolbarDivider />
                </div>
                <HoverMenuBar>
                    <FileMenu
                        onMenuItemClick={onMenuItemClick}
                        onSaveOrSaveAs={onSaveOrSaveAs}
                    />
                    <ViewMenu />
                    <DownloadMenu />
                </HoverMenuBar>
            </div>
            <OpenFileDialog
                open={currentDialog === 'open'}
                type={FILE_TYPE}
                filterVisTypes={FILTER_VIS_TYPES}
                defaultFilterVisType="ALL"
                onClose={onDialogClose}
                onFileSelect={(id) => {
                    onOpen(id)
                    onDialogClose()
                }}
                onNew={onNew}
                currentUser={currentUser}
            />
            <ActionsBarDialog
                currentDialog={currentDialog}
                onClose={onDialogClose}
            />
        </>
    )
}
