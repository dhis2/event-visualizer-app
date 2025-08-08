import { FC, ReactNode } from 'react'

type ToolbarSidebarProps = {
    children: ReactNode
    dataTest?: string
    isHidden?: boolean
}

export type ToolbarSidebar = FC<ToolbarSidebarProps>
