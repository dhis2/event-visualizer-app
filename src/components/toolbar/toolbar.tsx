import type { FC } from 'react'
import { InterpretationsAndDetailsToggler } from './interpretations-and-details-toggler'
import { UpdateButton } from './update-button'
import { VisualizationTypeSelector } from './visualization-type-selector/visualization-type-selector'
import { Toolbar as AnalyticsToolbar } from '@dhis2/analytics'

export const Toolbar: FC = () => (
    <AnalyticsToolbar>
        <VisualizationTypeSelector />
        <UpdateButton />
        <InterpretationsAndDetailsToggler />
    </AnalyticsToolbar>
)
