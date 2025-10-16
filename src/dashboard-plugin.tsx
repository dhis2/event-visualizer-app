// eslint-disable-next-line  no-restricted-imports
import { useDataQuery } from '@dhis2/app-runtime'
import { type FC } from 'react'
import { getVisualizationQueryFields } from '@api/event-visualizations-api'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { DashboardPluginWrapper } from '@dhis2/analytics'
import './locales/index.js'
import type { CurrentUser, SavedVisualization } from '@types'

type DashboardPluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: SavedVisualization
    filters?: Record<string, string>
}

const DashboardPlugin: FC<DashboardPluginProps> = (props) => {
    console.log('DashboardPlugin props', props)
    console.log('vis id', props.visualization.id)

    // fetch the visualization
    const { data, error, loading } = useDataQuery({
        eventVisualization: {
            resource: 'eventVisualizations',
            id: props.visualization.id, // TODO: this should be just passed as visualizationId
            params: {
                fields: getVisualizationQueryFields(
                    // derive displayNameProperty from displayProperty
                    // this depends on user settings and we only receive displayProperty in props
                    props.displayProperty === 'name'
                        ? 'displayName'
                        : 'displayShortName'
                ),
            },
        },
    })

    // TODO: handle errors
    if (error) {
        // `error` will be of type EngineError and `data` will is possibly undefined
        console.log('ERROR!', data, error)
        return <div>Error loading event visualization: {error.message}</div>
    }

    // TODO: check this type. The PluginWrapper expects a CurrentVisualization type, which includes empty but not null.
    // Before the visualization is fetched, the prop is undefined/null and that fails in the check for visualization.type
    const eventVisualization =
        (data?.eventVisualization as SavedVisualization) ?? {}

    console.log('dp eventVisualization', eventVisualization, 'loading', loading)

    return (
        <DashboardPluginWrapper {...props}>
            {(props) => (
                // TODO: use the metadata provider here?
                // in that way the plugin components can use the lookup functions and not have to care in which context they are used (app/dashboard-plugin)
                // the onResponseReceived can also simply be implemented in both cases for adding metadata from analytics to the metadata store
                <PluginWrapper
                    displayProperty={props.displayProperty}
                    filters={props.filters}
                    visualization={eventVisualization}
                    isVisualizationLoading={loading}
                    //onResponseReceived={onResponseReceived}
                />
            )}
        </DashboardPluginWrapper>
    )
}

// eslint-disable-next-line import/no-default-export
export default DashboardPlugin
