import { Plugin as UntypedPlugin } from '@dhis2/app-runtime/experimental'
import { NoticeBox } from '@dhis2/ui'
import { useCallback, useState, type FC } from 'react'
import { VISUALIZATIONS } from './fixtures'

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
    onError: (error: Error) => void
}

const Plugin: FC<HostPluginProps> = UntypedPlugin

export const HostPage: FC = () => {
    const [visualizationId, setVisualizationId] = useState<string>('')
    const [error, setError] = useState<Error | undefined>()

    const onError = useCallback((pluginError: Error) => {
        setError(pluginError)
    }, [])

    return (
        <div style={{ padding: 16, display: 'grid', gap: 16 }}>
            <h1 style={{ fontSize: 18, fontWeight: 600 }}>
                Plugin host (dev only)
            </h1>

            <div data-test="plugin-host-controls" style={{ maxWidth: 420 }}>
                <label
                    htmlFor="plugin-host-visualization-select"
                    style={{ display: 'block', marginBottom: 4 }}
                >
                    Visualization
                </label>
                {/* A native <select>, not a DHIS2 UI SingleSelectField: the
                 * DHIS2 UI widget renders a div-based listbox with no
                 * underlying <select>, which Cypress's cy.select() requires. */}
                <select
                    id="plugin-host-visualization-select"
                    data-test="plugin-host-visualization-select"
                    value={visualizationId}
                    onChange={(event) => {
                        setError(undefined)
                        setVisualizationId(event.target.value)
                    }}
                >
                    <option value="" disabled>
                        Select a visualization
                    </option>
                    {VISUALIZATIONS.map(({ id, label, type }) => (
                        <option key={id} value={id}>
                            {`${label} (${type})`}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <NoticeBox error title="The plugin reported an error">
                    {error.message}
                </NoticeBox>
            )}

            {visualizationId && (
                <div
                    data-test="plugin-host-iframe-wrap"
                    style={{ border: '1px solid #d5dde5', minHeight: 400 }}
                >
                    <Plugin
                        pluginSource="/plugin.html"
                        height={400}
                        visualization={{ id: visualizationId }}
                        displayProperty="name"
                        forDashboard
                        isVisualizationLoaded
                        cacheId={`plugin-host-${visualizationId}`}
                        onError={onError}
                    />
                </div>
            )}
        </div>
    )
}
