import type { FC, ReactNode } from 'react'
import { InterpretationsProvider as AnalyticsInterpretationsProvider } from '@dhis2/analytics'
import { useCurrentUser } from '@hooks'

export const InterpretationsProvider: FC<{ children: ReactNode }> = ({
    children,
}) => {
    const currentUser = useCurrentUser()

    return (
        <AnalyticsInterpretationsProvider currentUser={currentUser}>
            {children}
        </AnalyticsInterpretationsProvider>
    )
}
