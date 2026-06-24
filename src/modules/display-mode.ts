import type { ConditionsObject } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'

export type DisplayMode = 'EXACT' | 'GROUP'

/* Display mode is derived from the dimension's conditions: a legendSet means
 * the dimension is grouped into that set's ranges, anything else is exact. */
export const getDisplayMode = (conditions: ConditionsObject): DisplayMode =>
    conditions.legendSet ? 'GROUP' : 'EXACT'

/* The set grouping defaults to when entering Group mode: the dimension's
 * metadata default (which also drives BY_DATA_ITEM coloring), falling back to
 * the first available set, or undefined when the dimension has no sets. */
export const getDefaultLegendSetId = (
    dimension: Pick<DimensionMetadataItem, 'legendSetId'>,
    availableSets: ReadonlyArray<{ id: string }>
): string | undefined => dimension.legendSetId ?? availableSets[0]?.id

export const enterGroupMode = (defaultSetId: string): ConditionsObject => ({
    legendSet: defaultSetId,
    condition: undefined,
})

export const enterExactMode = (): ConditionsObject => ({
    legendSet: undefined,
    condition: undefined,
})

/* Re-pointing grouping to a different set clears the band condition: bands are
 * identified per legend set, so a selection from the old set is meaningless
 * against the new one. */
export const setGroupLegendSet = (setId: string): ConditionsObject => ({
    legendSet: setId,
    condition: undefined,
})
