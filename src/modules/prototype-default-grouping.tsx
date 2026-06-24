/* PROTOTYPE ONLY — remove before merge.
 *
 * A/B toggle for the add-time default of the "Group into ranges" feature
 * (see docs/superpowers/specs/2026-06-24-legend-set-group-into-ranges-design.md).
 *
 *   OFF (shipped default B): adding a dimension does nothing special — it
 *     arrives exact in both visualization types.
 *   ON  (add-only C): when a dimension that canHaveLegendSets is added with no
 *     existing conditions entry, seed it grouped in PIVOT_TABLE (and leave it
 *     exact in LINE_LIST), using its metadata legendSetId or — since the
 *     analytics dimensions endpoint that feeds the sidebar omits legend sets —
 *     a one-time fetch of its first legend set when that's absent.
 *
 * Everything prototype-specific lives in this one file: the localStorage flag,
 * the add-time seam (tSeedPrototypeGroupingOnAdd), and the toggle control.
 * To remove the prototype: delete this file, the `dispatch(tSeed…)` lines
 * tagged `PROTOTYPE ONLY` at the add sites, and the toggle mounted in app.tsx.
 */
import type { ThunkExtraArg } from '@api/custom-base-query'
import { Checkbox } from '@dhis2/ui'
import { setVisUiConfigConditionsByDimension } from '@store/vis-ui-config-slice'
import type { AppDispatch, DimensionMetadataItem, RootState } from '@types'
import { useState, type CSSProperties, type FC } from 'react'
import { enterGroupMode } from './display-mode'
import { isValueTypeNumeric } from './value-type'

const STORAGE_KEY = 'EVENT_VISUALIZER_PROTOTYPE_DEFAULT_GROUPING'

export const isPrototypeDefaultGroupingEnabled = (): boolean => {
    /* Default ON for the A/B prototype so it's exercised without clicking the
     * toggle, but OFF under test — the suite never sets the flag, and a global
     * default of ON would fire the add-time seam across every add-dispatch test. */
    const defaultEnabled = process.env.NODE_ENV !== 'test'
    try {
        const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
        if (raw === 'true') {
            return true
        }
        if (raw === 'false') {
            return false
        }
        return defaultEnabled
    } catch {
        return defaultEnabled
    }
}

const setPrototypeDefaultGroupingEnabled = (enabled: boolean): void => {
    try {
        globalThis.localStorage?.setItem(STORAGE_KEY, String(enabled))
    } catch {
        /* localStorage unavailable (private mode, etc.) — flag stays off */
    }
}

const canHaveLegendSets = (dimension: DimensionMetadataItem): boolean =>
    dimension.dimensionType === 'PROGRAM_INDICATOR' ||
    (!!dimension.valueType && isValueTypeNumeric(dimension.valueType))

const LEGEND_SET_RESOURCE_BY_TYPE: Partial<
    Record<DimensionMetadataItem['dimensionType'], string>
> = {
    DATA_ELEMENT: 'dataElements',
    PROGRAM_ATTRIBUTE: 'trackedEntityAttributes',
    PROGRAM_INDICATOR: 'programIndicators',
}

/* One-time fetch of the dimension's first legend set, used only when the
 * metadata item carries no legendSetId — the analytics dimensions endpoint
 * that feeds the sidebar omits legend sets, so freshly added dims have none. */
const fetchDefaultLegendSetId = async (
    dimension: DimensionMetadataItem,
    engine: ThunkExtraArg['engine']
): Promise<string | undefined> => {
    const resource = LEGEND_SET_RESOURCE_BY_TYPE[dimension.dimensionType]

    if (!resource) {
        return undefined
    }

    try {
        const response = (await engine.query({
            legendSets: {
                resource,
                id: dimension.dimensionId,
                params: { fields: 'legendSets[id]' },
            },
        })) as { legendSets?: { legendSets?: Array<{ id: string }> } }

        return response.legendSets?.legendSets?.[0]?.id
    } catch {
        return undefined
    }
}

/* The shared add-time seam. Dispatched right after both add vectors
 * (drag-and-drop and the modal add-to-layout); no-op unless the flag is on,
 * the visualization is a pivot, and a freshly added dimension is eligible.
 * Presence-keyed off conditionsByDimension (mirrors seedDefaultItemsIfAbsent)
 * so re-adds and user-cleared state are never clobbered. */
export const tSeedPrototypeGroupingOnAdd =
    (dimensionIds: string[]) =>
    (
        dispatch: AppDispatch,
        getState: () => RootState,
        extra: ThunkExtraArg
    ): void => {
        if (!isPrototypeDefaultGroupingEnabled()) {
            return
        }

        if (getState().visUiConfig.visualizationType !== 'PIVOT_TABLE') {
            return
        }

        const { metadataStore, engine } = extra

        const seedDimension = async (dimensionId: string): Promise<void> => {
            if (dimensionId in getState().visUiConfig.conditionsByDimension) {
                return
            }

            const dimension =
                metadataStore.getDimensionMetadataItem(dimensionId)

            if (!dimension || !canHaveLegendSets(dimension)) {
                return
            }

            const legendSetId =
                dimension.legendSetId ??
                (await fetchDefaultLegendSetId(dimension, engine))

            if (!legendSetId) {
                return
            }

            /* Re-read after the await: bail if the state moved on (mode
             * switched away from pivot, or conditions seeded/cleared meanwhile)
             * so the async seed never clobbers a more recent user action. */
            const { visUiConfig } = getState()

            if (
                visUiConfig.visualizationType !== 'PIVOT_TABLE' ||
                dimensionId in visUiConfig.conditionsByDimension
            ) {
                return
            }

            const { legendSet, condition } = enterGroupMode(legendSetId)

            dispatch(
                setVisUiConfigConditionsByDimension({
                    dimensionId,
                    conditions: condition,
                    legendSet,
                })
            )
        }

        void Promise.all(dimensionIds.map(seedDimension))
    }

const toggleStyle: CSSProperties = {
    position: 'fixed',
    bottom: 8,
    insetInlineStart: 8,
    zIndex: 10000,
    padding: '6px 10px',
    background: 'var(--colors-yellow050, #fff8e1)',
    border: '1px solid var(--colors-yellow500, #ffc324)',
    borderRadius: 4,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
}

export const PrototypeDefaultGroupingToggle: FC = () => {
    const [enabled, setEnabled] = useState(isPrototypeDefaultGroupingEnabled)

    return (
        <div style={toggleStyle} data-test="prototype-default-grouping-toggle">
            <Checkbox
                dense
                label="⚠ PROTOTYPE: default numeric dims to ranges in pivots"
                checked={enabled}
                onChange={({ checked }) => {
                    setEnabled(checked)
                    setPrototypeDefaultGroupingEnabled(checked)
                }}
            />
        </div>
    )
}
