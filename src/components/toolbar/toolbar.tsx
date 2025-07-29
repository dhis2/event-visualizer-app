import { Toolbar as AnalyticsToolbar } from '@dhis2/analytics'
import React from 'react'
import VisualizationTypeSelector from './visualization-type-selector/visualization-type-selector'

const Toolbar = () => (
    <AnalyticsToolbar>
        <VisualizationTypeSelector />
    </AnalyticsToolbar>
)

export default Toolbar
