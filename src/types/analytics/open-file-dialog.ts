import type { CurrentUser } from '@types'
import type { FC } from 'react'

type OpenFileDialogProps = {
    currentUser: CurrentUser
    defaultFilterVisType?: string
    filterVisTypes?: { type: string; insertDivider?: boolean }[]
    type: string
    open: boolean
    onClose: () => void
    onFileSelect: (id: string) => void
    onNew: () => void
}

export type OpenFileDialog = FC<OpenFileDialogProps>
