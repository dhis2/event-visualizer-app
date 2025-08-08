import { Toolbar as AnalyticsToolbar } from '@dhis2/analytics'
import React, { FC } from 'react'
import { VisualizationTypeSelector } from './visualization-type-selector/visualization-type-selector'

export const Toolbar: FC = () => (
    <AnalyticsToolbar>
        <VisualizationTypeSelector />
    </AnalyticsToolbar>
)
