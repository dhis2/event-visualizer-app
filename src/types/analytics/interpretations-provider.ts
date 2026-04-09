import type { CurrentUser } from '@types'
import type { FC, ReactNode } from 'react'

type InterpretationsProviderProps = {
    children: ReactNode
    currentUser: CurrentUser
}

export type InterpretationsProvider = FC<InterpretationsProviderProps>
