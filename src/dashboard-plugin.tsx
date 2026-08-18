import { getVisualizationQueryFields } from '@api/event-visualizations-api'
import { AppCachedDataQueryProvider } from '@components/app-wrapper/app-cached-data-query-provider'
import {
    PluginMetadataProvider,
    useMetadataStore,
} from '@components/app-wrapper/metadata-provider/metadata-provider'
import { StoreProvider } from '@components/app-wrapper/store-provider'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { DashboardPluginWrapper } from '@dhis2/analytics'
import { useRtkQuery } from '@hooks'
import { logger } from '@modules/logger'
import {
    normalizeApiSavedVisualization,
    toCurrentVis,
} from '@modules/visualization/state'
import type {
    ApiSavedVisualization,
    CurrentUser,
    CurrentVisualization,
    EmptyVisualization,
    HostFilters,
    SavedVisualization,
} from '@types'
import { useEffect, useMemo, type FC } from 'react'
import './locales/index.js'

type DashboardPluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: SavedVisualization
    filters?: HostFilters
}

const DashboardPluginContent: FC<DashboardPluginProps> = (props) => {
    logger.debug('DashboardPlugin props', props)
    logger.debug('vis id', props.visualization.id)

    const metadataStore = useMetadataStore()

    /* useRtkQuery (not useDataQuery) because its arg is a plain value RTK
     * Query re-keys its cache on. useDataQuery freezes its query definition
     * on first render, so a later change to props.visualization.id would be
     * silently ignored and the plugin would keep showing the first
     * visualization. */
    const { data, error, isLoading, refetch } = useRtkQuery<{
        eventVisualization: ApiSavedVisualization
    }>({
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
        const apiVis = data?.eventVisualization
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

    logger.debug(
        'dp currentVisualization',
        currentVisualization,
        'isLoading',
        isLoading
    )

    return (
        <DashboardPluginWrapper {...props}>
            {(pluginProps: DashboardPluginProps) => (
                <PluginWrapper
                    displayProperty={pluginProps.displayProperty}
                    filters={pluginProps.filters}
                    visualization={currentVisualization}
                    visualizationLoadError={error}
                    onRetryLoad={() => void refetch()}
                    isVisualizationLoading={isLoading}
                />
            )}
        </DashboardPluginWrapper>
    )
}

const DashboardPlugin: FC<DashboardPluginProps> = (props) => (
    <AppCachedDataQueryProvider>
        <PluginMetadataProvider>
            <StoreProvider>
                <DashboardPluginContent {...props} />
            </StoreProvider>
        </PluginMetadataProvider>
    </AppCachedDataQueryProvider>
)

// eslint-disable-next-line import/no-default-export
export default DashboardPlugin
