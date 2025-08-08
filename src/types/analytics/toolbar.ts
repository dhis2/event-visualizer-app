import { FC, ReactNode } from 'react'

type ToolbarProps = {
    children: ReactNode
    dataTest?: string
}

export type Toolbar = FC<ToolbarProps>
