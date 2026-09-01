import {
    buildAxis,
    collectProgramDimensions,
    resolveTeiFields,
} from '@modules/layout'
import { getEnabledOptions } from '@modules/options'
import type { CurrentVisState } from '@store/current-vis-slice'
import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import type { CurrentVisualization, MetadataStore } from '@types'
import { isCurrentVisualizationPersisted, isVisualizationEmpty } from './guards'

const shouldPopulateCustomValueFields = (
    currentVis: CurrentVisState,
    visUiConfig: VisUiConfigState,
    withCustomValue?: boolean
): boolean => {
    // Only EVENT output can carry a custom value
    if (visUiConfig.outputType !== 'EVENT') {
        return false
    }
    if (withCustomValue !== undefined) {
        return withCustomValue // explicit request: add or strip
    }
    return Boolean(currentVis.value?.id) // preserve what the current vis shows
}

const resolveCustomValueFields = (
    currentVis: CurrentVisState,
    visUiConfig: VisUiConfigState,
    withCustomValue?: boolean
) => {
    // Always include the `value` key: setCurrentVis merges into the previous
    // currentVis, so omitting it would leave a stale value behind.
    if (
        !shouldPopulateCustomValueFields(
            currentVis,
            visUiConfig,
            withCustomValue
        )
    ) {
        return { value: undefined, aggregationType: undefined }
    }

    const { customValue } = visUiConfig

    if (!customValue) {
        throw new Error(
            'shouldPopulateCustomValueFields is true but visUiConfig.customValue is missing'
        )
    }
    return {
        value: { id: customValue.id },
        aggregationType: customValue.aggregationType,
    }
}

/* Rebuild a currentVis fresh from visUiConfig so stale currentVis fields can't
 * leak through. Carries over only id and sorting from the previous currentVis.
 * The custom value fields go after the options spread so the value's own
 * aggregation type wins over the options default. `withCustomValue` overrides
 * whether the result carries the custom value: true forces it on, false strips
 * it; omit it to preserve the previous currentVis. */
export const buildCurrentVisFromVisUiConfig = ({
    previousCurrentVis,
    visUiConfig,
    metadataStore,
    withCustomValue,
}: {
    previousCurrentVis: CurrentVisState
    visUiConfig: VisUiConfigState
    metadataStore: MetadataStore
    withCustomValue?: boolean
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
    ...resolveTeiFields(visUiConfig, metadataStore),
    ...resolveCustomValueFields(
        previousCurrentVis,
        visUiConfig,
        withCustomValue
    ),
})
