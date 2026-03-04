import { useCallback, useMemo, useRef, useState } from 'react'
import { useUnmount } from 'usehooks-ts'

const SHOW_DELAY = 250
const MIN_LOAD_DURATION = 400

export const useIsDelayedLoadingMore = () => {
    const [isLoading, setIsLoading] = useState(false)
    const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const startLoadingTimestampRef = useRef<number | null>(null)
    const startDelayedLoadingMore = useCallback(() => {
        startTimeoutRef.current = setTimeout(() => {
            setIsLoading(true)
            startLoadingTimestampRef.current = Date.now()
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
    const completeDelayedLoadingMore = useCallback(
        async (): Promise<void> =>
            new Promise((resolve) => {
                clearTimeouts()

                // Never transitioned to loading state
                if (!startLoadingTimestampRef.current) {
                    return resolve()
                }

                const elapsedTime =
                    Date.now() - startLoadingTimestampRef.current

                // We can unset it now
                startLoadingTimestampRef.current = null

                // Loading state lasted long enough
                if (elapsedTime >= MIN_LOAD_DURATION) {
                    setIsLoading(false)
                    resolve()
                } else {
                    // Wait until min load duration expires
                    const remainingTime = MIN_LOAD_DURATION - elapsedTime
                    finishTimeoutRef.current = setTimeout(() => {
                        setIsLoading(false)
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
            isDelayedLoadingMore: isLoading,
            startDelayedLoadingMore,
            completeDelayedLoadingMore,
        }),
        [isLoading, startDelayedLoadingMore, completeDelayedLoadingMore]
    )
}
