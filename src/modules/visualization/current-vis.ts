import { DEFAULT_OPTIONS } from '@constants/options'
import {
    buildAxis,
    collectProgramDimensions,
    resolveTeiFields,
} from '@modules/layout'
import { getEnabledOptions } from '@modules/options'
import { isPopulatedString } from '@modules/utils/guards'
import type { CurrentVisState } from '@store/current-vis-slice'
import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import type {
    CurrentVisualization,
    EventVisualizationOptions,
    MetadataStore,
    SavedVisualization,
} from '@types'
import { isCurrentVisualizationPersisted, isVisualizationEmpty } from './guards'

/* Keys on CurrentVisualization that are NOT part of EventVisualizationOptions.
 * Combined with the option keys (derived from DEFAULT_OPTIONS) this gives the
 * full set of CurrentVisualization keys at runtime. */
const CURRENT_VIS_NON_OPTION_KEYS: ReadonlyArray<
    Exclude<keyof CurrentVisualization, keyof EventVisualizationOptions>
> = [
    'type',
    'outputType',
    'columns',
    'rows',
    'filters',
    'trackedEntityType',
    'attributeDimensions',
    'sorting',
    'value',
    'id',
    'programDimensions',
]

const CURRENT_VIS_KEYS: ReadonlyArray<keyof CurrentVisualization> = [
    ...CURRENT_VIS_NON_OPTION_KEYS,
    ...(Object.keys(DEFAULT_OPTIONS) as Array<keyof EventVisualizationOptions>),
]

/**
 * The CurrentVisualization-shaped subset of a SavedVisualization. The API
 * returns fields the app never edits (access, createdBy, …); only the editable
 * subset belongs in current-vis state. Values are copied as they are — a field
 * the API left out stays out, rather than becoming an explicit undefined.
 */
export const toCurrentVis = (
    savedVis: SavedVisualization
): CurrentVisualization => {
    const result: Record<string, unknown> = {}
    for (const key of CURRENT_VIS_KEYS) {
        if (savedVis[key] !== undefined) {
            result[key] = savedVis[key]
        }
    }
    return result as CurrentVisualization
}

const resolveCellValueFields = (visUiConfig: VisUiConfigState) => {
    /* Always include the `value` key: setCurrentVis merges into the previous
     * currentVis, so omitting it would leave a stale value behind. Only a pivot
     * table shows aggregated cells, so only it can carry a cell value. */
    const { cellValue, visualizationType } = visUiConfig

    if (visualizationType !== 'PIVOT_TABLE' || !cellValue) {
        return { value: undefined, aggregationType: undefined }
    }

    return {
        value: { id: cellValue.id },
        aggregationType: cellValue.aggregationType,
    }
}

/* Rebuild a currentVis fresh from visUiConfig so stale currentVis fields can't
 * leak through. Carries over only id and sorting from the previous currentVis.
 * The value fields go after the options spread so the value's own aggregation
 * type wins over the options default. */
export const buildCurrentVisFromVisUiConfig = ({
    previousCurrentVis,
    visUiConfig,
    metadataStore,
}: {
    previousCurrentVis: CurrentVisState
    visUiConfig: VisUiConfigState
    metadataStore: MetadataStore
}): CurrentVisualization => ({
    id: isCurrentVisualizationPersisted(previousCurrentVis)
        ? previousCurrentVis.id
        : undefined,
    sorting: isVisualizationEmpty(previousCurrentVis)
        ? undefined
        : previousCurrentVis.sorting,
    type: visUiConfig.visualizationType,
    outputType: visUiConfig.outputType,
    columns: buildAxis(visUiConfig.layout.columns, visUiConfig, metadataStore),
    rows: buildAxis(visUiConfig.layout.rows, visUiConfig, metadataStore),
    filters: buildAxis(visUiConfig.layout.filters, visUiConfig, metadataStore),
    programDimensions: collectProgramDimensions(visUiConfig, metadataStore),
    ...getEnabledOptions(visUiConfig.options),
    // There is no generated subtitle, so an empty one is a hidden one
    hideSubtitle: !isPopulatedString(visUiConfig.options.subtitle),
    ...resolveTeiFields(visUiConfig, metadataStore),
    ...resolveCellValueFields(visUiConfig),
})
