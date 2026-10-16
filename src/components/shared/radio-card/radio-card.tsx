import { FieldSet, Legend, Radio } from '@dhis2/ui'
import cx from 'classnames'
import { type FC, type PropsWithChildren } from 'react'
import classes from './styles/radio-card.module.css'

type RadioCardProps = PropsWithChildren<{
    selected: boolean
    label: string
    value: string
    name: string
    dataTest: string
    onSelect: () => void
    disabled?: boolean
    helpText?: string
    /* Gives the label the weight of a title and pairs it more tightly with its
     * help text. For cards whose help text is part of the choice rather than an
     * aside about it. */
    emphasized?: boolean
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
    emphasized = false,
    children,
}) => (
    <div
        className={cx(classes.card, {
            [classes.cardSelected]: selected,
            [classes.cardDisabled]: disabled,
            [classes.cardEmphasized]: emphasized,
        })}
        data-test={dataTest}
    >
        <div className={classes.cardContent}>
            <Radio
                name={name}
                label={
                    <span className={classes.cardLabelContent}>
                        <span className={classes.cardTitle}>{label}</span>
                        {helpText ? (
                            <p className={classes.cardHelp}>{helpText}</p>
                        ) : null}
                    </span>
                }
                value={value}
                checked={selected}
                onChange={onSelect}
                disabled={disabled}
                dense
                className={classes.cardRadio}
                dataTest={`${dataTest}-radio`}
            />
        </div>
        {selected && children ? (
            <div className={classes.revealed}>{children}</div>
        ) : null}
    </div>
)

type RadioCardGroupProps = PropsWithChildren<{
    legend: string
    hideLegend?: boolean
    horizontal?: boolean
}>

export const RadioCardGroup: FC<RadioCardGroupProps> = ({
    legend,
    hideLegend = false,
    horizontal = false,
    children,
}) => (
    <FieldSet>
        <Legend>
            <span
                className={cx({
                    [classes.visuallyHidden]: hideLegend,
                    [classes.heading]: !hideLegend,
                })}
            >
                {legend}
            </span>
        </Legend>
        <div
            className={cx(classes.cards, {
                [classes.cardsRow]: horizontal,
            })}
        >
            {children}
        </div>
    </FieldSet>
)
