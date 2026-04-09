import type { SavedVisualization } from '@types'
import { type FC } from 'react'

type RenameDialogProps = {
    object: SavedVisualization
    type: string
    onClose: () => void
    onRename: ({
        name,
        description,
    }: {
        name?: string
        description?: string
    }) => void
}

export type RenameDialog = FC<RenameDialogProps>
