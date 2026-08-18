import { Plugin as UntypedPlugin } from '@dhis2/app-runtime/experimental'
import { NoticeBox } from '@dhis2/ui'
import type { HostFilters } from '@types'
import { useCallback, useState, type FC } from 'react'

/* `Plugin`'s shipped type only names its own layout props (pluginSource,
 * height, width, ...) and forwards everything else to the iframe at
 * runtime through an untyped rest parameter. This re-types it for the
 * specific extra props this host sends, mirroring what dashboard-app's
 * IframePlugin sends its embedded plugins. */
type HostPluginProps = {
    pluginSource: string
    /* A fixed pixel height, like a real dashboard grid cell. Without it,
     * Plugin falls back to content-driven sizing: it waits for the plugin's
     * own content to report a height, but PivotTable renders into a
     * percentage-height container that never resolves without a definite
     * ancestor height, so it stays 0x0. */
    height: number
    visualization: { id: string }
    displayProperty: string
    forDashboard: boolean
    isVisualizationLoaded: boolean
    cacheId: string
    filters?: HostFilters
    onError: (error: Error) => void
}

const Plugin: FC<HostPluginProps> = UntypedPlugin

/* Not a real org unit: nothing downstream resolves this id, since the plugin
 * only checks whether a dashboard filter is present, never its value. */
const UNAPPLIED_FILTERS: HostFilters = { ou: [{ id: 'plugin-host-test' }] }

export const HostPage: FC = () => {
    const [visualizationId, setVisualizationId] = useState('')
    const [error, setError] = useState<Error | undefined>()
    const [filtersOn, setFiltersOn] = useState(false)
    const trimmedVisualizationId = visualizationId.trim()

    const onError = useCallback((pluginError: Error) => {
        setError(pluginError)
    }, [])

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
                    {/* A native <input>, not a DHIS2 UI InputField: the DHIS2
                     * UI widget renders without an underlying <input>, which
                     * cy.type() requires. */}
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
                    <Plugin
                        pluginSource="/plugin.html"
                        height={400}
                        visualization={{ id: trimmedVisualizationId }}
                        displayProperty="name"
                        forDashboard
                        isVisualizationLoaded
                        cacheId={`plugin-host-${trimmedVisualizationId}`}
                        filters={filtersOn ? UNAPPLIED_FILTERS : undefined}
                        onError={onError}
                    />
                </div>
            )}
        </div>
    )
}
