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
        /* The radio's own <label> covers the title but not the help text or the
         * revealed controls. Selecting from the help text too keeps the whole
         * card surface live, matching the pointer cursor it carries. */
        onClick={(event) => {
            const target = event.target as HTMLElement

            if (
                !disabled &&
                !target.closest('label') &&
                !target.closest(`.${classes.revealed}`)
            ) {
                onSelect()
            }
        }}
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

type RadioCardGroupProps = PropsWithChildren<{
    legend: string
    hideLegend?: boolean
    /* Cards side by side instead of stacked. Suits a set of short, mutually
     * exclusive labels; a card that reveals controls when selected should stay
     * stacked so the revealed area has full width. */
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
