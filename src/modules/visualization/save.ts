import { getHeadersMap } from '@modules/analytics-request'
import { removeNonPersistedDimensionProperties } from '@modules/dimension/translation'
import type {
    CurrentVisualization,
    SavedVisualization,
    SortDirection,
} from '@types'

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

    visualization.columns = removeNonPersistedDimensionProperties(
        visualization.columns
    )
    visualization.filters = removeNonPersistedDimensionProperties(
        visualization.filters
    )
    visualization.rows = removeNonPersistedDimensionProperties(
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
        /* Only the fields the backend stores: it looks the item up by uid and
         * reads the stage it was chosen from, which is what keeps a data
         * element belonging to several stages from aggregating across all of
         * them. The aggregation the user chose is the top-level one; the
         * `aggregationType` the API returns here is the data item's own
         * default, which the app reads but never writes. */
        value: vis.value
            ? {
                  id: vis.value.id,
                  programStage: vis.value.programStage,
              }
            : undefined,
    }
    // Remove legacy flag when saving — a legacy-loaded vis is re-saved in the new format.
    delete result.legacy
    return result as SavedVisualization
}
