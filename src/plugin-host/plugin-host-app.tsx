import {
    getTotalsMode,
    setTotalsMode,
    type TotalsMode,
} from '@components/line-list/totals-debug'
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

/* Rough sizes of dashboard items, from a narrow side item to a full row */
const ITEM_SIZES = {
    small: { label: 'Small (360 × 300)', width: 360, height: 300 },
    medium: { label: 'Medium (600 × 400)', width: 600, height: 400 },
    large: { label: 'Large (800 × 400)', width: 800, height: 400 },
    wide: { label: 'Full width (1200 × 500)', width: 1200, height: 500 },
} as const

type ItemSize = keyof typeof ITEM_SIZES

const TOTALS_OPTIONS: Array<{ mode: TotalsMode; label: string }> = [
    { mode: 'off', label: 'No totals' },
    { mode: 'fake', label: 'Fake totals (1,234 rows)' },
    { mode: 'fake-large', label: 'Fake totals (24,700 rows)' },
]

export const PluginHostApp: FC = () => {
    const [visualizationId, setVisualizationId] = useState('')
    const [filtersOn, setFiltersOn] = useState(false)
    const [itemSize, setItemSize] = useState<ItemSize>('large')
    const [totalsMode, setTotalsModeState] = useState(getTotalsMode)
    const { width, height } = ITEM_SIZES[itemSize]
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
                    <span>
                        Apply a dashboard filter (never reaches the request;
                        only shows the &quot;not applied&quot; notice)
                    </span>
                </label>

                <label style={{ display: 'grid', gap: 4 }}>
                    <span>Dashboard item size</span>
                    <select
                        value={itemSize}
                        onChange={(event) =>
                            setItemSize(event.target.value as ItemSize)
                        }
                    >
                        {Object.entries(ITEM_SIZES).map(([key, { label }]) => (
                            <option key={key} value={key}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>

                {/* Prototype only: the plugin reads this when it fetches, so
                 * the iframe is remounted (via its key) to pick it up. */}
                <label style={{ display: 'grid', gap: 4 }}>
                    <span>Line list page totals</span>
                    <select
                        value={totalsMode}
                        onChange={(event) => {
                            const mode = event.target.value as TotalsMode
                            setTotalsMode(mode)
                            setTotalsModeState(mode)
                        }}
                    >
                        {TOTALS_OPTIONS.map(({ mode, label }) => (
                            <option key={mode} value={mode}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {trimmedVisualizationId && (
                <div
                    data-test="plugin-host-iframe-wrap"
                    style={{
                        border: '1px solid #d5dde5',
                        width,
                        maxWidth: '100%',
                    }}
                >
                    {/* Key by id so each visualization gets a fresh iframe, like a dashboard item. */}
                    <Plugin
                        key={`${trimmedVisualizationId}-${totalsMode}`}
                        pluginSource="/plugin.html"
                        height={height}
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
