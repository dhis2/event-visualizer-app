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
    CurrentVisualization,
    DashboardPluginProps,
    EmptyVisualization,
    SavedVisualization,
} from '@types'
import { useEffect, useMemo, useState, type FC } from 'react'

const DashboardPluginContent: FC<DashboardPluginProps> = (props) => {
    logger.debug('DashboardPlugin props', props)
    logger.debug('vis id', props.visualizationId)

    const metadataStore = useMetadataStore()

    /* A dashboard item is bound to a fixed visualization id, so we only fetch
     * on mount. */
    const { data, error, loading, refetch } = useDataQuery({
        eventVisualization: {
            resource: 'eventVisualizations',
            id: props.visualizationId,
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

    /* Mirror the in-app load pipeline (see store/thunks.ts): normalise the
     * raw API response once; the metadata store consumes the SavedVisualization
     * and the plugin consumes the CurrentVisualization-shaped subset.
     * PluginWrapper reads that metadata on its first render, so the
     * visualization is only passed down once its metadata is registered. */
    const [registeredVisualization, setRegisteredVisualization] = useState<
        SavedVisualization | undefined
    >(undefined)

    useEffect(() => {
        const apiVis = data?.eventVisualization as
            ApiSavedVisualization | undefined
        if (!apiVis) {
            return
        }
        const savedVisualization = normalizeApiSavedVisualization(apiVis)
        metadataStore.setVisualizationMetadata(savedVisualization)
        setRegisteredVisualization(savedVisualization)
    }, [data, metadataStore])

    const currentVisualization = useMemo<
        CurrentVisualization | EmptyVisualization
    >(
        () =>
            registeredVisualization
                ? toCurrentVis(registeredVisualization)
                : {},
        [registeredVisualization]
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

export const DashboardItem: FC<DashboardPluginProps> = (props) => (
    <PluginMetadataProvider>
        <DashboardPluginContent {...props} />
    </PluginMetadataProvider>
)
