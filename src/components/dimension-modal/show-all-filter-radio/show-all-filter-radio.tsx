import i18n from '@dhis2/d2-i18n'
import { FieldSet, Legend, Radio } from '@dhis2/ui'
import cx from 'classnames'
import { type FC, type PropsWithChildren } from 'react'
import classes from './styles/show-all-filter-radio.module.css'

export type FilterRadioMode = 'SHOW_ALL' | 'FILTER'

type RadioCardProps = PropsWithChildren<{
    selected: boolean
    label: string
    value: FilterRadioMode
    name: string
    dataTest: string
    onSelect: () => void
    disabled?: boolean
    helpText?: string
}>

const RadioCard: FC<RadioCardProps> = ({
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

type ShowAllFilterRadioProps = PropsWithChildren<{
    mode: FilterRadioMode
    onModeChange: (mode: FilterRadioMode) => void
    dataTest?: string
    filterDisabled?: boolean
    filterDisabledHelp?: string
}>

export const ShowAllFilterRadio: FC<ShowAllFilterRadioProps> = ({
    mode,
    onModeChange,
    dataTest = 'show-all-filter-radio',
    filterDisabled = false,
    filterDisabledHelp,
    children,
}) => (
    <FieldSet>
        <Legend>
            <span className={classes.visuallyHidden}>
                {i18n.t('Value filtering')}
            </span>
        </Legend>
        <div className={classes.cards}>
            <RadioCard
                selected={mode === 'SHOW_ALL'}
                label={i18n.t('Show all values')}
                value="SHOW_ALL"
                name={dataTest}
                dataTest={`${dataTest}-show-all`}
                onSelect={() => onModeChange('SHOW_ALL')}
            />
            <RadioCard
                selected={mode === 'FILTER'}
                label={i18n.t('Filter')}
                value="FILTER"
                name={dataTest}
                dataTest={`${dataTest}-filter`}
                onSelect={() => onModeChange('FILTER')}
                disabled={filterDisabled}
                helpText={filterDisabled ? filterDisabledHelp : undefined}
            >
                {children}
            </RadioCard>
        </div>
    </FieldSet>
)
