import type { FC } from 'react'
import { VisualizationTypeSelector } from './visualization-type-selector/visualization-type-selector'
import { Toolbar as AnalyticsToolbar } from '@dhis2/analytics'

export const Toolbar: FC = () => (
    <AnalyticsToolbar>
        <VisualizationTypeSelector />
    </AnalyticsToolbar>
)
