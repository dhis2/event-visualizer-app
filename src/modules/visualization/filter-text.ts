import {
    getConditionsMetadataIds,
    getConditionsTexts,
    type Conditions,
} from '@modules/condition-texts'
import { getCompoundDimensionId } from '@modules/dimension/ids'
import {
    getItemDisplayNames,
    getItemMetadataIds,
} from '@modules/dimension/item-names'
import { toLayoutDimension } from '@modules/dimension/layout-dimension'
import {
    buildSuffixContext,
    type SuffixContext,
} from '@modules/dimension/suffix'
import { combineAllDimensionsFromVisualization } from '@modules/dimension/translation'
import { getStartEndDateFormatter } from '@modules/utils/dates'
import type {
    CurrentVisualization,
    DimensionRecord,
    MetadataStore,
} from '@types'

/* Matches the separator the pivot table engine has always used for its own
 * filter line. */
const FRAGMENT_SEPARATOR = ' - '

const getCompoundId = (
    dimension: DimensionRecord,
    visualization: CurrentVisualization
): string =>
    getCompoundDimensionId(
        dimension,
        visualization.outputType,
        visualization.trackedEntityType?.id
    )

/* Suffixes disambiguate a dimension against the rest of the layout, so the
 * context is built from every axis rather than the filters alone. */
const getSuffixContext = (
    visualization: CurrentVisualization,
    metadataStore: MetadataStore
): SuffixContext => {
    const programIds = new Set<string>()
    const programStageIds = new Set<string>()

    for (const dimension of combineAllDimensionsFromVisualization(
        visualization
    )) {
        const item = metadataStore.getDimensionMetadataItem(
            getCompoundId(dimension, visualization)
        )
        if (item?.programId) {
            programIds.add(item.programId)
        }
        if (item?.programStageId) {
            programStageIds.add(item.programStageId)
        }
    }

    return buildSuffixContext({
        programs: Object.values(
            metadataStore.getMetadataItems(Array.from(programIds))
        ),
        programStages: Object.values(
            metadataStore.getMetadataItems(Array.from(programStageIds))
        ),
    })
}

const getFilterValueTexts = ({
    dimension,
    conditions,
    layoutDimension,
    metadataStore,
    locale,
    digitGroupSeparator,
}: {
    dimension: DimensionRecord
    conditions: Conditions
    layoutDimension: ReturnType<typeof toLayoutDimension>
    metadataStore: MetadataStore
    locale?: string
    digitGroupSeparator: CurrentVisualization['digitGroupSeparator']
}): string[] => {
    if (conditions.condition || conditions.legendSet) {
        return getConditionsTexts({
            conditions,
            dimension: layoutDimension,
            formatValueOptions: { locale, digitGroupSeparator },
            metadataItems: metadataStore.getMetadataItems(
                getConditionsMetadataIds({
                    conditions,
                    dimension: layoutDimension,
                })
            ),
        })
    }

    const itemIds = (dimension.items ?? [])
        .map((item) => item.id)
        .filter((id): id is string => Boolean(id))
    if (!itemIds.length) {
        return []
    }

    return getItemDisplayNames({
        itemIds,
        metadataItems: metadataStore.getMetadataItems(
            getItemMetadataIds(itemIds)
        ),
        formatStartEndDate: getStartEndDateFormatter(locale),
    })
}

/**
 * The text of the filter line shown beneath the title and subtitle. Both
 * visualisation types render it from this one function so they cannot drift:
 * the line list draws its own row, the pivot table takes it as `filterText`.
 *
 * `locale` is only used to format custom start/end dates. It is undefined in
 * the dashboard plugin, which has no access to the user's settings, and then
 * falls back to the runtime default.
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
    const filters = visualization.filters ?? []
    if (!filters.length) {
        return ''
    }

    const suffixContext = getSuffixContext(visualization, metadataStore)
    const fragments: string[] = []

    for (const dimension of filters) {
        const compoundId = getCompoundId(dimension, visualization)
        const metadataItem = metadataStore.getDimensionMetadataItem(compoundId)
        if (!metadataItem) {
            continue
        }

        const layoutDimension = toLayoutDimension(
            compoundId,
            metadataItem,
            suffixContext
        )
        const valueTexts = getFilterValueTexts({
            dimension,
            conditions: {
                condition: dimension.filter,
                legendSet: dimension.legendSet?.id,
            },
            layoutDimension,
            metadataStore,
            locale,
            digitGroupSeparator: visualization.digitGroupSeparator,
        })

        if (!valueTexts.length) {
            continue
        }

        const label = layoutDimension.suffix
            ? `${layoutDimension.name} · ${layoutDimension.suffix}`
            : layoutDimension.name

        fragments.push(`${label}: ${valueTexts.join(', ')}`)
    }

    return fragments.join(FRAGMENT_SEPARATOR)
}
