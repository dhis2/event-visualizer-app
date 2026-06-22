import { getVisualizationQueryFields } from '@api/event-visualizations-api'
import {
    PluginMetadataProvider,
    useMetadataStore,
} from '@components/app-wrapper/metadata-provider/metadata-provider'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { DashboardPluginWrapper } from '@dhis2/analytics'
// eslint-disable-next-line no-restricted-imports
import { useDataQuery } from '@dhis2/app-runtime'
import { logger } from '@modules/logger'
import {
    normalizeApiSavedVisualization,
    toCurrentVis,
} from '@modules/visualization'
import type {
    ApiSavedVisualization,
    CurrentUser,
    CurrentVisualization,
    EmptyVisualization,
    SavedVisualization,
} from '@types'
import { useEffect, useMemo, type FC } from 'react'
import './locales/index.js'

type DashboardPluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: SavedVisualization
    filters?: Record<string, string>
}

const DashboardPluginContent: FC<DashboardPluginProps> = (props) => {
    logger.debug('DashboardPlugin props', props)
    logger.debug('vis id', props.visualization.id)

    const metadataStore = useMetadataStore()

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

    // Mirror the in-app load pipeline (see store/thunks.ts): normalise the
    // raw API response once; the metadata store consumes the SavedVisualization
    // and the plugin consumes the CurrentVisualization-shaped subset.
    const savedVisualization = useMemo(() => {
        const apiVis = data?.eventVisualization as
            | ApiSavedVisualization
            | undefined
        return apiVis ? normalizeApiSavedVisualization(apiVis) : undefined
    }, [data])

    useEffect(() => {
        if (savedVisualization) {
            metadataStore.setVisualizationMetadata(savedVisualization)
        }
    }, [savedVisualization, metadataStore])

    const currentVisualization = useMemo<
        CurrentVisualization | EmptyVisualization
    >(
        () => (savedVisualization ? toCurrentVis(savedVisualization) : {}),
        [savedVisualization]
    )

    // TODO: handle errors
    if (error) {
        // `error` will be of type EngineError and `data` will is possibly undefined
        logger.error('ERROR!', data, error)
        return <div>Error loading event visualization: {error.message}</div>
    }

    logger.debug(
        'dp currentVisualization',
        currentVisualization,
        'loading',
        loading
    )

    return (
        <DashboardPluginWrapper {...props}>
            {(pluginProps: DashboardPluginProps) => (
                <PluginWrapper
                    displayProperty={pluginProps.displayProperty}
                    filters={pluginProps.filters}
                    visualization={currentVisualization}
                    isVisualizationLoading={loading}
                />
            )}
        </DashboardPluginWrapper>
    )
}

const DashboardPlugin: FC<DashboardPluginProps> = (props) => (
    <PluginMetadataProvider>
        <DashboardPluginContent {...props} />
    </PluginMetadataProvider>
)

// eslint-disable-next-line import/no-default-export
export default DashboardPlugin
