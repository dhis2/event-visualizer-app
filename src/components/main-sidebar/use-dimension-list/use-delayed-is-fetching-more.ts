import { useCallback, useMemo, useRef, useState } from 'react'
import { useUnmount } from 'usehooks-ts'

const SHOW_DELAY = 250
const MIN_LOAD_DURATION = 400

export const useIsDelayedFetchingMore = () => {
    const [isFetching, setIsFetching] = useState(false)
    const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const startFetchingTimestampRef = useRef<number | null>(null)
    const startDelayedFetchingMore = useCallback(() => {
        startTimeoutRef.current = setTimeout(() => {
            setIsFetching(true)
            startFetchingTimestampRef.current = Date.now()
        }, SHOW_DELAY)
    }, [])
    const clearTimeouts = useCallback(() => {
        if (startTimeoutRef.current) {
            clearTimeout(startTimeoutRef.current)
            startTimeoutRef.current = null
        }
        if (finishTimeoutRef.current) {
            clearTimeout(finishTimeoutRef.current)
            finishTimeoutRef.current = null
        }
    }, [])
    const completeDelayedFetchingMore = useCallback(
        async (): Promise<void> =>
            new Promise((resolve) => {
                clearTimeouts()

                // Never transitioned to loading state
                if (!startFetchingTimestampRef.current) {
                    return resolve()
                }

                const elapsedTime =
                    Date.now() - startFetchingTimestampRef.current

                // We can unset it now
                startFetchingTimestampRef.current = null

                // Loading state lasted long enough
                if (elapsedTime >= MIN_LOAD_DURATION) {
                    setIsFetching(false)
                    resolve()
                } else {
                    // Wait until min load duration expires
                    const remainingTime = MIN_LOAD_DURATION - elapsedTime
                    finishTimeoutRef.current = setTimeout(() => {
                        setIsFetching(false)
                        resolve()
                    }, remainingTime)
                }
            }),
        [clearTimeouts]
    )

    useUnmount(() => {
        clearTimeouts()
    })

    return useMemo(
        () => ({
            isDelayedFetchingMore: isFetching,
            startDelayedFetchingMore,
            completeDelayedFetchingMore,
        }),
        [isFetching, startDelayedFetchingMore, completeDelayedFetchingMore]
    )
}
