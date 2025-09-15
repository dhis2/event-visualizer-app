import type { FC } from 'react'
import { getVisualizationQueryFields } from '@api/event-visualizations-api'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { DashboardPluginWrapper } from '@dhis2/analytics'
import { useRtkQuery } from '@hooks'
import './locales/index.js'
import type { CurrentUser, SavedVisualization } from '@types'

type DashboardPluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: SavedVisualization
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
                fields: getVisualizationQueryFields(
                    // derive displayNameProperty from displayProperty
                    // this depends on user settings and we only receive displayProperty in props
                    props.displayProperty === 'name'
                        ? 'displayName'
                        : 'displayShortName'
                ),
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

    return (
        <DashboardPluginWrapper {...props}>
            {(props) => (
                // TODO use the metadata provider here?
                // in that way the plugin components can use the lookup functions and not have to care in which context they are used (app/dashboard-plugin)
                // the onResponsesReceived can also simply be implemented in both cases for adding metadata from analytics to the metadata store
                <PluginWrapper
                    displayProperty={props.displayProperty}
                    filters={props.filters}
                    visualization={data}
                />
            )}
        </DashboardPluginWrapper>
    )
}

// eslint-disable-next-line import/no-default-export
export default DashboardPlugin
