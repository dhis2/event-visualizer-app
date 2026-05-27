import cx from 'classnames'
import type { FC } from 'react'
import classes from './styles/custom-value-option.module.css'

type CustomValueOptionProps = {
    label: string
    value: string
    active: boolean
    onClick: () => void
    stageName?: string
}

export const CustomValueOption: FC<CustomValueOptionProps> = ({
    label,
    value,
    active,
    onClick,
    stageName,
}) => (
    <div
        className={cx(classes.option, { [classes.active]: active })}
        onClick={onClick}
        role="option"
        aria-selected={active}
        data-value={value}
        data-label={label}
    >
        <svg
            className={classes.checkmark}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            {active && (
                <path d="M3.63209 7.83214C3.27209 7.47214 2.72009 7.47214 2.36009 7.83214C2.00009 8.19214 2.00009 8.74414 2.36009 9.10414L5.62409 12.3681C5.98409 12.7281 6.53609 12.7281 6.89609 12.3681L14.6481 4.64014C15.0081 4.28014 15.0081 3.72814 14.6481 3.36814C14.2881 3.00814 13.7361 3.00814 13.3521 3.36814L6.27209 10.4721L3.63209 7.83214Z" />
            )}
        </svg>
        <span className={classes.label}>{label}</span>
        {stageName && <span className={classes.stageChip}>{stageName}</span>}
    </div>
)
