import { useEffect, useRef } from 'react'
import queryString from 'query-string'
import { useAppDispatch, useAppSelector } from '../hooks'
import { setNavigationState } from '../store'
import { history } from '../modules'
import { Location } from 'history'

export const StoreToLocationSyncer = () => {
    const lastLocationRef = useRef<Location | null>(null)
    const dispatch = useAppDispatch()
    const { visualizationId, interpretationId } = useAppSelector(
        (state) => state.navigation
    )

    // Sync URL → Redux
    useEffect(() => {
        const updateFromLocation = (location: Location) => {
            /* GLOBAL SHELL RELATED CODE:
             * Avoid duplicate actions for the same update object. This also
             * avoids a loop, because dispatching a pop state effect below also
             * triggers listeners again (but with the same location object key) */
            const { key, pathname, search } = location
            if (
                key === lastLocationRef.current?.key &&
                pathname === lastLocationRef.current?.pathname &&
                search === lastLocationRef.current?.search
            ) {
                return
            }
            lastLocationRef.current = location
            // Dispatch this event for external routing listeners to observe,
            // e.g. global shell
            const popStateEvent = new PopStateEvent('popstate', {
                state: location.state,
            })
            dispatchEvent(popStateEvent)

            // APP RELATED CODE:
            const visualizationId = location.pathname.slice(1) // remove leading "/"
            const queryParams = queryString.parse(location.search)

            if (visualizationId) {
                dispatch(
                    setNavigationState({
                        visualizationId: visualizationId,
                        interpretationId:
                            typeof queryParams.interpretation === 'string'
                                ? queryParams.interpretation
                                : null,
                    })
                )
            }
        }

        // Initial sync
        updateFromLocation(history.location)

        // Listen for changes
        const unlisten = history.listen(({ location }) => {
            updateFromLocation(location)
        })

        return unlisten
    }, [dispatch])

    // Sync Redux → URL
    useEffect(() => {
        if (!visualizationId) {
            return
        }
        const currentPath = history.location.pathname + history.location.search
        let newPath = `/${visualizationId}`

        if (interpretationId) {
            const interpretationQueryString = queryString.stringify({
                interpretationId: interpretationId,
            })
            newPath += `?${interpretationQueryString}`
        }

        if (currentPath !== newPath) {
            history.push(newPath)
        }
    }, [visualizationId, interpretationId])

    return null
}
