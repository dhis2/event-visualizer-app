import { useCallback, useEffect, useId, useRef } from 'react'

/* Moves focus to a condition's value input after its operator is chosen.
 *
 * The DHIS2 UI Input has no ref or `initialFocus` prop, so we can't focus it
 * directly. It does copy its `name` prop onto the DOM element's `id`, so we
 * make an id here, set it as the input's `name`, and then look the element up
 * by id to focus it.
 *
 * We wait one animation frame before focusing. Picking an operator closes the
 * operator dropdown, which puts focus back on itself first. Waiting a frame
 * means our focus runs after that and sticks. */
export const useValueInputFocus = (): {
    valueInputId: string
    focusValueInput: () => void
} => {
    const valueInputId = useId()
    const frameRef = useRef<number>()

    const focusValueInput = useCallback(() => {
        if (frameRef.current !== undefined) {
            cancelAnimationFrame(frameRef.current)
        }
        frameRef.current = requestAnimationFrame(() => {
            document.getElementById(valueInputId)?.focus()
        })
    }, [valueInputId])

    useEffect(
        () => () => {
            if (frameRef.current !== undefined) {
                cancelAnimationFrame(frameRef.current)
            }
        },
        []
    )

    return { valueInputId, focusValueInput }
}
