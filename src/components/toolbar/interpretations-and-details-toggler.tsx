import { InterpretationsAndDetailsToggler as AnalyticsInterpretationsAndDetailsToggler } from '@dhis2/analytics'
import React, { FC } from 'react'

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
