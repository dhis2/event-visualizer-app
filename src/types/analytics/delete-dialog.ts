import { type FC } from 'react'

type DeleteDialogProps = {
    id: string
    type: string
    onClose: () => void
    onDelete: () => void
    onError: (error: string) => void
}

export type DeleteDialog = FC<DeleteDialogProps>
