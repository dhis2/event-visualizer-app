import type { FC } from 'react'
import type {
    CurrentUser,
    CurrentVisualization,
    EventVisualizationType,
    VisualizationType,
} from '@types'

type FileType = 'visualization' | 'eventVisualization' | 'eventReport' | 'map'

type FileMenuRenamePayload = {
    name: string
    description: string
}

// TODO check if any of these should be required
type FileMenuProps = {
    currentUser?: CurrentUser
    defaultFilterVisType?: string
    fileObject?: CurrentVisualization
    fileType?: FileType
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
