import { toLayoutDimension } from '@modules/dimension/layout-dimension'
import { getDimensionLabel, getSuffixContext } from '@modules/dimension/suffix'
import {
    getDimensionValueMetadataIds,
    getDimensionValueTexts,
} from '@modules/dimension/value-texts'
import { getStartEndDateFormatter } from '@modules/utils/dates'
import { getVisualizationUiConfig } from '@modules/visualization/state'
import type { CurrentVisualization, MetadataStore } from '@types'

// Aligned with the separator the pivot table engine produces
const FRAGMENT_SEPARATOR = ' - '

/**
 * The text of the filter line shown beneath the title and subtitle, for both
 * the line list and the pivot table.
 *
 * `locale` is only used to format custom start/end dates, and falls back to
 * the runtime default when the user's locale has not resolved yet.
 */
export const getVisualizationFilterText = ({
    visualization,
    metadataStore,
    locale,
}: {
    visualization: CurrentVisualization
    metadataStore: MetadataStore
    locale?: string
}): string => {
    const { layout, itemsByDimension, conditionsByDimension } =
        getVisualizationUiConfig(visualization)
    if (!layout.filters.length) {
        return ''
    }

    const suffixContext = getSuffixContext(
        [...layout.columns, ...layout.rows, ...layout.filters],
        metadataStore
    )
    const formatStartEndDate = getStartEndDateFormatter(locale)

    return layout.filters
        .flatMap((dimensionId) => {
            const dimension = toLayoutDimension(
                dimensionId,
                metadataStore.getDimensionMetadataItemOrThrow(dimensionId),
                suffixContext
            )
            const values = {
                dimension,
                itemIds: itemsByDimension[dimensionId] ?? [],
                conditions: conditionsByDimension[dimensionId] ?? {},
            }
            const valueTexts = getDimensionValueTexts({
                ...values,
                metadataItems: metadataStore.getMetadataItems(
                    getDimensionValueMetadataIds(values)
                ),
                formatValueOptions: {
                    digitGroupSeparator: visualization.digitGroupSeparator,
                },
                formatStartEndDate,
            })

            return valueTexts.length
                ? [
                      `${getDimensionLabel(dimension.name, dimension.suffix)}: ${valueTexts.join(', ')}`,
                  ]
                : []
        })
        .join(FRAGMENT_SEPARATOR)
}
