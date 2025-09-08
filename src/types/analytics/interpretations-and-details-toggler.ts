import type { FC } from 'react'

type InterpretationsAndDetailsTogglerProps = {
    onClick: () => void
    dataTest?: string
    disabled?: boolean
    isShowing?: boolean
}

export type InterpretationsAndDetailsToggler =
    FC<InterpretationsAndDetailsTogglerProps>
