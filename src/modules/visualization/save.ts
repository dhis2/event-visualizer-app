import { getHeadersMap } from '@modules/analytics-request'
import type {
    CurrentVisualization,
    DimensionArray,
    DimensionRecord,
    SavedVisualization,
    SortDirection,
} from '@types'

export const removeDimensionPropertiesBeforeSaving = (
    axis: DimensionArray
): DimensionArray => {
    return axis.map((dim) => {
        const dimension = { ...dim }
        const propsToRemove = ['dimensionType', 'valueType']

        propsToRemove.forEach((prop) => {
            delete dimension[prop as keyof DimensionRecord]
        })

        return dimension
    })
}

const getDimensionIdFromHeaderName = (
    headerName: string,
    visualization: CurrentVisualization
) =>
    Object.entries(getHeadersMap(visualization)).find(
        ([, value]) => value === headerName
    )?.[0]

export const getSaveableVisualization = (
    vis: SavedVisualization
): SavedVisualization => {
    const visualization = { ...vis }

    visualization.columns = removeDimensionPropertiesBeforeSaving(
        visualization.columns
    )
    visualization.filters = removeDimensionPropertiesBeforeSaving(
        visualization.filters
    )
    visualization.rows = removeDimensionPropertiesBeforeSaving(
        visualization.rows
    )

    // Use the first sorting item only and format for saving
    const sorting = vis.sorting?.length
        ? [
              {
                  dimension:
                      getDimensionIdFromHeaderName(
                          vis.sorting[0].dimension,
                          vis
                      ) || vis.sorting[0].dimension,
                  direction: vis.sorting[0].direction
                      ? (vis.sorting[0].direction.toUpperCase() as SortDirection)
                      : 'ASC',
              },
          ]
        : undefined

    const result: Partial<SavedVisualization> = {
        ...visualization,
        sorting,
    }
    // Remove legacy flag when saving — a legacy-loaded vis is re-saved in the new format.
    delete result.legacy
    return result as SavedVisualization
}
