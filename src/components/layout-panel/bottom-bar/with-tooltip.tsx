import { Tooltip } from '@dhis2/ui'
import { type FC, type ReactElement } from 'react'
import classes from './styles/with-tooltip.module.css'

export type TooltipConfig = { content: string; openDelay?: number } | undefined

const DEFAULT_OPEN_DELAY = 500

/* Wraps its child in a tooltip only when there is something to say, so the
 * bottom bar's disabled controls can explain themselves without every one of
 * them branching on it. The wrapping span carries the tooltip's pointer
 * handlers because disabled `<button>` elements don't emit pointer events in
 * some browsers. */
export const WithTooltip: FC<{
    tooltipConfig: TooltipConfig
    children: ReactElement
}> = ({ tooltipConfig, children }) => {
    if (!tooltipConfig) {
        return children
    }
    const { content, openDelay = DEFAULT_OPEN_DELAY } = tooltipConfig

    return (
        <Tooltip content={content} openDelay={openDelay}>
            {(tooltipProps: object) => (
                <span className={classes.tooltipWrapper} {...tooltipProps}>
                    {children}
                </span>
            )}
        </Tooltip>
    )
}
