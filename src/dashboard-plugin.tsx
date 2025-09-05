import type { FC } from 'react'
import { getVisualizationQueryFields } from '@api/event-visualizations-api'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { DashboardPluginWrapper } from '@dhis2/analytics'
import { useRtkQuery } from '@hooks'
import './locales/index.js'
import { CurrentUser, SavedVisualization } from '@types'

type DashboardPluginProps = {
    visualization: SavedVisualization
    displayProperty: CurrentUser['settings']['displayNameProperty']
    filters?: Record<string, string>
}

const DashboardPlugin: FC<DashboardPluginProps> = (props) => {
    console.log('DashboardPlugin props', props)

    // fetch the visualization
    const { data, isLoading, isError, error } = useRtkQuery<SavedVisualization>(
        {
            resource: 'eventVisualizations',
            id: props.visualization.id, // TODO this should be just passed as visualizationId
            params: {
                fields: getVisualizationQueryFields(props.displayProperty),
            },
        }
    )

    if (isLoading) {
        // Both `error` and `data` will be undefined here
        console.log(data, error)
        return <div>Loading event visualization...</div>
    }
    if (isError) {
        // `error` will be of type EngineError and `data` will is possibly undefined
        console.log(data, error)
        return <div>Error loading event visualization: {error.message}</div>
    }

    // TODO implement onDataSorted and any other function/callback that cannot rely on the Redux store
    // these need to be passed to PluginWrapper below

    return (
        <DashboardPluginWrapper {...props}>
            {(props) => (
                <PluginWrapper visualization={data} filters={props.filters} />
            )}
        </DashboardPluginWrapper>
    )
}

// eslint-disable-next-line import/no-default-export
export default DashboardPlugin
