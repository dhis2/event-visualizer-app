import type { FC, ReactNode } from 'react'

type HoverMenuListProps = {
    children: ReactNode
    className?: string
    dataTest?: string
    dense?: boolean
    maxHeight?: string
    maxWidth?: string
}

export type HoverMenuList = FC<HoverMenuListProps>
