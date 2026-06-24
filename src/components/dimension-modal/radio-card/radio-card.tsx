import { Radio } from '@dhis2/ui'
import cx from 'classnames'
import { type FC, type PropsWithChildren } from 'react'
import classes from './styles/radio-card.module.css'

export const RadioCardGroup: FC<PropsWithChildren> = ({ children }) => (
    <div className={classes.cards}>{children}</div>
)

type RadioCardProps = PropsWithChildren<{
    selected: boolean
    label: string
    value: string
    name: string
    dataTest: string
    onSelect: () => void
    disabled?: boolean
    helpText?: string
}>

export const RadioCard: FC<RadioCardProps> = ({
    selected,
    label,
    value,
    name,
    dataTest,
    onSelect,
    disabled = false,
    helpText,
    children,
}) => (
    <div
        className={cx(classes.card, {
            [classes.cardSelected]: selected,
            [classes.cardDisabled]: disabled,
        })}
        data-test={dataTest}
    >
        <Radio
            name={name}
            label={label}
            value={value}
            checked={selected}
            onChange={onSelect}
            disabled={disabled}
            dense
            className={classes.cardRadio}
            dataTest={`${dataTest}-radio`}
        />
        {helpText ? <p className={classes.cardHelp}>{helpText}</p> : null}
        {selected && children ? (
            <div className={classes.revealed}>{children}</div>
        ) : null}
    </div>
)
