import { Plugin as UntypedPlugin } from '@dhis2/app-runtime/experimental'
import type { PluginFilters } from '@types'
import { useState, type FC } from 'react'

/* Plugin types only its own layout props and forwards the rest as `any`, so
 * re-type it for the props this host sends. */
type HostPluginProps = {
    pluginSource: string
    /* Without a fixed height a PivotTable renders 0×0; a dashboard cell gives one. */
    height: number
    visualization: { id: string }
    displayProperty: string
    forDashboard: boolean
    isVisualizationLoaded: boolean
    cacheId: string
    filters?: PluginFilters
}

const Plugin: FC<HostPluginProps> = UntypedPlugin

/* The plugin only checks that a filter is present, never its value. */
const UNAPPLIED_FILTERS: PluginFilters = { ou: [{ id: 'plugin-host-test' }] }

export const PluginHostApp: FC = () => {
    const [visualizationId, setVisualizationId] = useState('')
    const [filtersOn, setFiltersOn] = useState(false)
    const trimmedVisualizationId = visualizationId.trim()

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
                    {/* Native input, not DHIS2 InputField: cy.type() needs a real <input>. */}
                    <input
                        id="plugin-host-visualization-id-input"
                        data-test="plugin-host-visualization-id-input"
                        type="text"
                        value={visualizationId}
                        onChange={(event) =>
                            setVisualizationId(event.target.value)
                        }
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

            {trimmedVisualizationId && (
                <div
                    data-test="plugin-host-iframe-wrap"
                    style={{ border: '1px solid #d5dde5', minHeight: 400 }}
                >
                    {/* Key by id so each visualization gets a fresh iframe, like a dashboard item. */}
                    <Plugin
                        key={trimmedVisualizationId}
                        pluginSource="/plugin.html"
                        height={400}
                        visualization={{ id: trimmedVisualizationId }}
                        displayProperty="name"
                        forDashboard
                        isVisualizationLoaded
                        cacheId={`plugin-host-${trimmedVisualizationId}`}
                        filters={filtersOn ? UNAPPLIED_FILTERS : undefined}
                    />
                </div>
            )}
        </div>
    )
}
