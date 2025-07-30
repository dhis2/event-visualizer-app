import { InterpretationsAndDetailsToggler as AnalyticsInterpretationsAndDetailsToggler } from '@dhis2/analytics'
import React from 'react'

const InterpretationsAndDetailsToggler = () => {
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

export default InterpretationsAndDetailsToggler
