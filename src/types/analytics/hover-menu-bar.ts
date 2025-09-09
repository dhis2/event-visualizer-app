import type { FC, ReactNode } from 'react'

type HoverMenuBarProps = {
    children: ReactNode
    dataTest?: string
}

export type HoverMenuBar = FC<HoverMenuBarProps>
