import type { FC } from 'react'
import { InterpretationsAndDetailsToggler as AnalyticsInterpretationsAndDetailsToggler } from '@dhis2/analytics'

export const InterpretationsAndDetailsToggler: FC = () => {
    const showDetailsPanel = false
    const id = undefined
    const onClick = () => console.log('TBD')

    return (
        <AnalyticsInterpretationsAndDetailsToggler
            disabled={!id}
            onClick={onClick}
            isShowing={showDetailsPanel}
        />
    )
}
