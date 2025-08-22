import { FC, ReactNode } from 'react'

type HoverMenuListItemProps = {
    children?: ReactNode
    className?: string
    dataTest?: string
    destructive?: boolean
    disabled?: boolean
    icon?: ReactNode
    label?: ReactNode
    onClick?: () => void // TODO use proper type
}

export type HoverMenuListItem = FC<HoverMenuListItemProps>
