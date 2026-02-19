import { Button, Tooltip } from '@dhis2/ui'
import type { FC, ReactElement } from 'react'
import classes from './styles/toggler.module.css'

type TogglerProps = {
    dataTest?: string
    disabled?: boolean
    icon: ReactElement // XXX: typically UI icon, but can be SVG
    tooltipText: string
    onClick: () => void
}

export const Toggler: FC<TogglerProps> = ({
    disabled = false,
    icon,
    tooltipText,
    onClick,
    dataTest,
}) => (
    <Tooltip content={tooltipText} closeDelay={0}>
        {({ /*onBlur, onFocus,*/ onMouseOver, onMouseOut, ref }) => (
            <span
                //                onBlur={onBlur}
                //                onFocus={onFocus}
                ref={ref}
                className={classes.tooltipAnchor}
            >
                <Button
                    icon={icon}
                    onClick={onClick}
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                    disabled={disabled}
                    small
                    secondary
                    aria-label={tooltipText}
                    className={classes.button}
                    data-test={dataTest}
                />
            </span>
        )}
    </Tooltip>
)
