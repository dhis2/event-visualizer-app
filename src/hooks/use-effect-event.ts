import {
    useRef,
    useCallback,
    useInsertionEffect,
    type MutableRefObject,
} from 'react'

export function useEffectEvent<
    T extends (...args: unknown[]) => unknown | void
>(callback: T): T {
    const ref = useRef<T>(null) as MutableRefObject<T | null>

    useInsertionEffect(() => {
        ref.current = callback
    })

    return useCallback(
        (...args: Parameters<T>) => ref.current?.(...args),
        []
    ) as T
}
