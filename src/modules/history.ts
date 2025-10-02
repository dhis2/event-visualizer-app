import { createHashHistory } from 'history'
import type { Location } from 'history'
import queryString from 'query-string'
import type { NavigationState } from '@store/navigation-slice'

export const history = createHashHistory()

export const getNavigationStateFromLocation = (
    location: Location = history.location
): NavigationState => {
    const pathVisualizationId = location.pathname.slice(1) // remove leading "/"
    const visualizationId = pathVisualizationId || 'new'
    const queryParams = queryString.parse(location.search)
    const interpretationId =
        // Ignore interpretationId in query param when on new path
        visualizationId === 'new' ||
        typeof queryParams.interpretationId !== 'string' ||
        queryParams.interpretationId.length === 0
            ? null
            : queryParams.interpretationId

    return { visualizationId, interpretationId }
}
