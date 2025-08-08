import { FC } from 'react'

type FileMenuRenamePayload = {
    name: string
    description: string
}

type FileMenuProps = {
    currentUser: Record<string, string>
    defaultFilterVisType: string
    fileObject: Record<string, string>
    fileType: string // TODO must be one of the supported file types
    filterVisTypes: Array<{ type: string }> // TODO same here
    onDelete: () => void
    onError: (error: string) => void
    onNew: () => void
    onOpen: (id: string) => void
    onRename: ({ name, description }: FileMenuRenamePayload) => void
    onSave: () => void
    onSaveAs: ({ name, description }: FileMenuRenamePayload) => void
    onShare: () => void
    onTranslate: () => void
}

export type FileMenu = FC<FileMenuProps>
