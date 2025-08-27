import { createContext, useContext, useCallback, useState } from 'react'
import type { FC, ReactNode } from 'react'
import { useDebounceCallback } from 'usehooks-ts'
import classes from './styles/scroll-box.module.css'

const ScrollBoxContext = createContext<number | null>(null)

/* The entries array only contains the entries which have resized, so this
 * could be the container, the content, or both. */
const readClientWidthFromEntries = (entries: ResizeObserverEntry[]): number => {
    let contentNode: Element | null = null
    for (const entry of entries) {
        if (entry.target.classList.contains(classes.container)) {
            // Found container node, just return its clientWidth
            return entry.target.clientWidth
        } else if (entry.target.classList.contains(classes.content)) {
            contentNode = entry.target
        }
    }
    if (typeof contentNode?.parentElement?.clientWidth !== 'number') {
        throw new Error('Could not read clientWidth from scrollbox container')
    }

    return contentNode.parentElement.clientWidth
}

export const ScrollBox: FC<{ children?: ReactNode }> = ({ children }) => {
    const [width, setWidth] = useState(0)
    const debouncedSetWidth = useDebounceCallback(setWidth, 150)
    const [resizeObserver] = useState(
        () =>
            new ResizeObserver((entries) => {
                debouncedSetWidth(readClientWidthFromEntries(entries))
            })
    )
    const containerCallbackRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (node === null) {
                // Callback ref is called with null when the component unmounts
                resizeObserver.disconnect()
            } else {
                // Callback ref is called once with populated node when the component mounts
                resizeObserver.observe(node)
                if (node.firstElementChild) {
                    // Observer the content to cover the edge case when scrollbar shows/hides
                    resizeObserver.observe(node.firstElementChild)
                }
            }
        },
        [resizeObserver]
    )

    return (
        <ScrollBoxContext.Provider value={width}>
            <div
                ref={containerCallbackRef}
                className={classes.container}
                data-test="scroll-box-container"
            >
                <div className={classes.content} data-test="scroll-box-content">
                    {children}
                </div>
            </div>
        </ScrollBoxContext.Provider>
    )
}

// Hooks for consuming dimensions
export const useScrollBoxWidth = (): number => {
    const width = useContext(ScrollBoxContext)
    if (width === null) {
        throw new Error('useScrollboxWidth must be used within a ScrollBox')
    }

    return width
}
