import type { FC, ReactNode } from 'react'

type HoverMenuListItemProps = {
    children?: ReactNode
    className?: string
    dataTest?: string
    destructive?: boolean
    disabled?: boolean
    icon?: ReactNode
    label?: ReactNode
    onClick?: () => void
}

export type HoverMenuListItem = FC<HoverMenuListItemProps>
