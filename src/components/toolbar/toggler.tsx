import { Button, Tooltip } from '@dhis2/ui'
import type { FC, ReactElement } from 'react'
import buttonClasses from './styles/button.module.css'
import classes from './styles/toggler.module.css'

type TogglerProps = {
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
}) => (
    <Tooltip content={tooltipText} closeDelay={0}>
        {({ onMouseOver, onMouseOut, ref }) => (
            <span
                onMouseOver={onMouseOver}
                onMouseOut={onMouseOut}
                ref={ref}
                className={classes.tooltipAnchor}
            >
                <Button
                    icon={icon}
                    onClick={onClick}
                    disabled={disabled}
                    small
                    secondary
                    aria-label={tooltipText}
                    className={buttonClasses.button}
                />
            </span>
        )}
    </Tooltip>
)
