import cx from 'classnames'
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type FC,
    type ReactNode,
} from 'react'
import classes from './styles/scroll-box.module.css'

const SCROLL_EPSILON = 1

export const ScrollBox: FC<{ children?: ReactNode }> = ({ children }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const [canScrollDown, setCanScrollDown] = useState(false)

    const updateScrollHints = useCallback(() => {
        const container = containerRef.current
        if (!container) {
            return
        }
        const hasContentBelow =
            container.scrollTop + container.clientHeight <
            container.scrollHeight - SCROLL_EPSILON
        setCanScrollDown((current) =>
            current === hasContentBelow ? current : hasContentBelow
        )
    }, [])

    useEffect(() => {
        const container = containerRef.current
        if (!container) {
            return
        }
        updateScrollHints()

        const resizeObserver = new ResizeObserver(updateScrollHints)
        resizeObserver.observe(container)
        if (contentRef.current) {
            resizeObserver.observe(contentRef.current)
        }
        return () => {
            resizeObserver.disconnect()
        }
    }, [updateScrollHints])

    return (
        <div className={classes.wrapper}>
            <div
                ref={containerRef}
                className={classes.container}
                onScroll={updateScrollHints}
                data-test="scroll-box-container"
            >
                <div
                    ref={contentRef}
                    className={classes.content}
                    data-test="scroll-box-content"
                >
                    {children}
                </div>
            </div>
            <div
                aria-hidden="true"
                className={cx(classes.scrollFade, {
                    [classes.scrollFadeVisible]: canScrollDown,
                })}
            />
        </div>
    )
}
