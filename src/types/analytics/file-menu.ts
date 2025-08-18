import { FC } from 'react'
import type { CurrentUserData } from '@components/app-wrapper/app-cached-data-query-provider'
import type { EventVisualizationType, VisualizationType } from '@types'

type FileMenuRenamePayload = {
    name: string
    description: string
}

// TODO check if any of these should be required
type FileMenuProps = {
    currentUser?: CurrentUserData // TODO check this one
    defaultFilterVisType?: string
    fileObject?: Record<string, string>
    fileType?: string // TODO replace with file types (not vis types)
    filterVisTypes?: Array<{
        type: EventVisualizationType | VisualizationType | string
    }>
    onDelete?: () => void
    onError?: (error: string) => void
    onNew?: () => void
    onOpen?: (id: string) => void
    onRename?: ({ name, description }: FileMenuRenamePayload) => void
    onSave?: () => void
    onSaveAs?: ({ name, description }: FileMenuRenamePayload) => void
    onShare?: () => void
    onTranslate?: () => void
}

export type FileMenu = FC<FileMenuProps>
