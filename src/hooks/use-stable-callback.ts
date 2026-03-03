import {
    useRef,
    useCallback,
    useLayoutEffect,
    type MutableRefObject,
} from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useStableCallback<T extends (...args: any[]) => any>(
    callback: T
): T {
    const ref = useRef<T>(null) as MutableRefObject<T | null>

    useLayoutEffect(() => {
        ref.current = callback
    })

    return useCallback(
        (...args: Parameters<T>) => ref.current?.(...args),
        []
    ) as T
}
