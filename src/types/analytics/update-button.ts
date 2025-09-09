import type { FC } from 'react'

type UpdateButtonProps = {
    onClick: () => void
    dataTest?: string
    disabled?: boolean
    loading?: boolean
}

export type UpdateButton = FC<UpdateButtonProps>
