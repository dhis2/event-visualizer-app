import type { DimensionRecord } from '@types'

type DimensionSelection = {
    items?: readonly unknown[]
    condition?: string | string[]
    legendSetId?: string
}

/* A dimension narrows or reshapes the analytics response only when something
 * is selected on it. A legend set counts, because it changes the response from
 * raw values to legend IDs. A filter with nothing selected has no effect, and
 * analytics rejects some, such as a bare PROGRAM_STATUS (E7222). */
export const isActiveFilterDimension = ({
    items,
    condition,
    legendSetId,
}: DimensionSelection): boolean =>
    Boolean(items?.length) || Boolean(condition?.length) || Boolean(legendSetId)

export const isActiveFilterDimensionRecord = (dim: DimensionRecord): boolean =>
    isActiveFilterDimension({
        items: dim.items,
        condition: dim.filter,
        legendSetId: dim.legendSet?.id,
    })
