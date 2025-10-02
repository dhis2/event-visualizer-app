import type { Location } from 'history'
import queryString from 'query-string'
import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector, useAppStore } from '@hooks'
import { getNavigationStateFromLocation, history } from '@modules/history'
import { setNavigationState } from '@store/navigation-slice'

export const StoreToLocationSyncer = () => {
    const lastLocationRef = useRef<Location | null>(null)
    const store = useAppStore()
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

            const locationState = getNavigationStateFromLocation()
            const { navigation: storeState } = store.getState()
            const hasChanges =
                locationState.visualizationId !== storeState.visualizationId ||
                locationState.interpretationId !== storeState.interpretationId

            if (hasChanges) {
                dispatch(
                    setNavigationState({
                        visualizationId: locationState.visualizationId,
                        interpretationId: locationState.interpretationId,
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
    }, [dispatch, store])

    // Sync Redux → URL
    useEffect(() => {
        if (
            !visualizationId ||
            // Treat `/` and `/new` the same
            (visualizationId === 'new' && history.location.pathname === '/')
        ) {
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
