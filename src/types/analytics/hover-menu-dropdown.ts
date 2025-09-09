import type { FC, ReactNode } from 'react'

type HoverMenuDropdownProps = {
    children: ReactNode
    className?: string
    dataTest?: string
    disabled?: boolean
    label?: ReactNode
}

export type HoverMenuDropdown = FC<HoverMenuDropdownProps>
