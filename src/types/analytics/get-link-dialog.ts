import { type FC } from 'react'

type GetLinkDialogProps = {
    id: string
    type: string
    onClose: () => void
}

export type GetLinkDialog = FC<GetLinkDialogProps>
