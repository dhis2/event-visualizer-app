import { type FC } from 'react'
import type { SavedVisualization } from '@types'

type SaveAsDialogProps = {
    object: SavedVisualization
    type: string
    onClose: () => void
    onSaveAs?: ({
        name,
        description,
    }: {
        name: string
        description: string
    }) => void
}

export type SaveAsDialog = FC<SaveAsDialogProps>
