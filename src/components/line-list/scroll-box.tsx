import { createContext, useContext, useCallback, useState } from 'react'
import type { FC, ReactNode } from 'react'
import { useDebounceCallback } from 'usehooks-ts'
import { FetchOverlay, type ClientBox } from './fetch-overlay'
import classes from './styles/scroll-box.module.css'

const ScrollBoxContext = createContext<number | null>(null)

/* The entries array only contains the entries which have resized, so this
 * could be the container, the content, or both. */
const findContainerInEntries = (entries: ResizeObserverEntry[]): Element => {
    let contentNode: Element | null = null
    for (const entry of entries) {
        if (entry.target.classList.contains(classes.container)) {
            return entry.target
        } else if (entry.target.classList.contains(classes.content)) {
            contentNode = entry.target
        }
    }
    if (!contentNode?.parentElement) {
        throw new Error('Could not find the scrollbox container')
    }

    return contentNode.parentElement
}

/* The client box is the container without its border and scrollbars */
const readClientBox = (container: Element): ClientBox => ({
    left: container.clientLeft,
    top: container.clientTop,
    width: container.clientWidth,
    height: container.clientHeight,
})

type ScrollBoxProps = {
    children?: ReactNode
    isFetching?: boolean
}

export const ScrollBox: FC<ScrollBoxProps> = ({
    children,
    isFetching = false,
}) => {
    const [clientBox, setClientBox] = useState<ClientBox>({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
    })
    const debouncedSetClientBox = useDebounceCallback(setClientBox, 80)
    const [resizeObserver] = useState(
        () =>
            new ResizeObserver((entries) => {
                debouncedSetClientBox(
                    readClientBox(findContainerInEntries(entries))
                )
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
        <ScrollBoxContext.Provider value={clientBox.width}>
            <div className={classes.frame}>
                <div
                    ref={containerCallbackRef}
                    className={classes.container}
                    data-test="scroll-box-container"
                >
                    <div
                        className={classes.content}
                        data-test="scroll-box-content"
                    >
                        {children}
                    </div>
                </div>
                {isFetching && <FetchOverlay clientBox={clientBox} />}
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
