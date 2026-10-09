import { getVisualizationQueryFields } from '@api/event-visualizations-api'
import { parseEngineError } from '@api/parse-engine-error'
import {
    PluginMetadataProvider,
    useMetadataStore,
} from '@components/app-wrapper/metadata-provider/metadata-provider'
import { PluginWrapper } from '@components/plugin-wrapper/plugin-wrapper'
import { DashboardPluginWrapper } from '@dhis2/analytics'
/* useDataQuery, not the RTK-query hooks: the plugin carries no app store (see
 * CLAUDE.md > plugin providers). */
// eslint-disable-next-line no-restricted-imports
import { useDataQuery } from '@dhis2/app-runtime'
import { logger } from '@modules/logger'
import { toCurrentVis } from '@modules/visualization/current-vis'
import { normalizeApiSavedVisualization } from '@modules/visualization/normalize-legacy'
import type {
    ApiSavedVisualization,
    CurrentUser,
    CurrentVisualization,
    EmptyVisualization,
    PluginFilters,
    SavedVisualization,
} from '@types'
import { useEffect, useMemo, type FC } from 'react'
import './locales/index.js'

type DashboardPluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: SavedVisualization
    filters?: PluginFilters
}

const DashboardPluginContent: FC<DashboardPluginProps> = (props) => {
    logger.debug('DashboardPlugin props', props)
    logger.debug('vis id', props.visualization.id)

    const metadataStore = useMetadataStore()

    /* A dashboard item is bound to a fixed visualization id, so we only fetch
     * on mount. */
    const { data, error, loading, refetch } = useDataQuery({
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
            ApiSavedVisualization | undefined
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

    const visualizationLoadError = useMemo(
        () => (error ? parseEngineError(error) : undefined),
        [error]
    )

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
                    visualizationLoadError={visualizationLoadError}
                    onRetryLoad={() => void refetch()}
                    isVisualizationLoading={loading}
                    isInDashboard
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
