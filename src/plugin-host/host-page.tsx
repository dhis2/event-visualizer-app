import { Plugin as UntypedPlugin } from '@dhis2/app-runtime/experimental'
import { NoticeBox } from '@dhis2/ui'
import type { PluginFilters } from '@types'
import { useCallback, useMemo, useState, type FC } from 'react'

/* Plugin's shipped type only lists its own layout props and forwards the rest
 * untyped. Re-typed here for the extra props this host sends. */
type HostPluginProps = {
    pluginSource: string
    /* Fixed height like a real dashboard grid cell. Without it PivotTable
     * renders into an unresolved percentage-height container and stays 0x0. */
    height: number
    visualization: { id: string }
    displayProperty: string
    forDashboard: boolean
    isVisualizationLoaded: boolean
    cacheId: string
    filters?: PluginFilters
    onError: (error: Error) => void
}

const Plugin: FC<HostPluginProps> = UntypedPlugin

/* Not a real org unit — the plugin only checks that a filter is present, never
 * its value. */
const UNAPPLIED_FILTERS: PluginFilters = { ou: [{ id: 'plugin-host-test' }] }

export const HostPage: FC = () => {
    const [visualizationId, setVisualizationId] = useState('')
    const [error, setError] = useState<Error | undefined>()
    const [filtersOn, setFiltersOn] = useState(false)
    const trimmedVisualizationId = visualizationId.trim()

    const onError = useCallback((pluginError: Error) => {
        setError(pluginError)
    }, [])

    /* Plugin re-notifies the iframe when any prop changes identity, so memoize
     * to avoid resending (and refetching) on every host render. */
    const pluginProps = useMemo(
        () => ({
            visualization: { id: trimmedVisualizationId },
            displayProperty: 'name',
            forDashboard: true,
            isVisualizationLoaded: true,
            cacheId: `plugin-host-${trimmedVisualizationId}`,
            filters: filtersOn ? UNAPPLIED_FILTERS : undefined,
            onError,
        }),
        [trimmedVisualizationId, filtersOn, onError]
    )

    return (
        <div style={{ padding: 16, display: 'grid', gap: 16 }}>
            <h1 style={{ fontSize: 18, fontWeight: 600 }}>
                Plugin host (dev only)
            </h1>

            <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
                <div>
                    <label
                        htmlFor="plugin-host-visualization-id-input"
                        style={{ display: 'block', marginBottom: 4 }}
                    >
                        Visualization id
                    </label>
                    {/* Native <input>, not DHIS2 UI's InputField: cy.type()
                     * needs a real <input>, which that widget doesn't render. */}
                    <input
                        id="plugin-host-visualization-id-input"
                        data-test="plugin-host-visualization-id-input"
                        type="text"
                        value={visualizationId}
                        onChange={(event) => {
                            setError(undefined)
                            setVisualizationId(event.target.value)
                        }}
                        style={{ width: '100%' }}
                    />
                </div>

                <label
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    <input
                        type="checkbox"
                        data-test="plugin-host-filter-toggle"
                        checked={filtersOn}
                        onChange={(event) => setFiltersOn(event.target.checked)}
                    />
                    Apply a dashboard filter (never reaches the request; only
                    shows the &quot;not applied&quot; notice)
                </label>
            </div>

            {error && (
                <NoticeBox error title="The plugin reported an error">
                    {error.message}
                </NoticeBox>
            )}

            {trimmedVisualizationId && (
                <div
                    data-test="plugin-host-iframe-wrap"
                    style={{ border: '1px solid #d5dde5', minHeight: 400 }}
                >
                    {/* Keyed on the id so changing it remounts the iframe,
                     * modelling how a real dashboard gives each item its own
                     * iframe bound to a fixed visualization. */}
                    <Plugin
                        key={trimmedVisualizationId}
                        pluginSource="/plugin.html"
                        height={400}
                        {...pluginProps}
                    />
                </div>
            )}
        </div>
    )
}
