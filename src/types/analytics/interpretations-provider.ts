import type { FC, ReactNode } from 'react'
import type { CurrentUser } from '@types'

type InterpretationsProviderProps = {
    children: ReactNode
    currentUser: CurrentUser
}

export type InterpretationsProvider = FC<InterpretationsProviderProps>
