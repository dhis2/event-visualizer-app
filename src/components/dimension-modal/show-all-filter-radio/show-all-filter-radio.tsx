import { RadioCard, RadioCards } from '@components/shared/radio-card/radio-card'
import i18n from '@dhis2/d2-i18n'
import { FieldSet, Legend } from '@dhis2/ui'
import { type FC, type PropsWithChildren } from 'react'
import classes from './styles/show-all-filter-radio.module.css'

export type FilterRadioMode = 'SHOW_ALL' | 'FILTER'

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
}) => {
    const radioGroupName = `${dataTest}-mode`

    return (
        <FieldSet>
            <Legend>
                <span className={classes.visuallyHidden}>
                    {i18n.t('Value filtering')}
                </span>
            </Legend>
            <RadioCards>
                <RadioCard
                    selected={mode === 'SHOW_ALL'}
                    label={i18n.t('Show all values')}
                    value="SHOW_ALL"
                    name={radioGroupName}
                    dataTest={`${dataTest}-show-all`}
                    onSelect={() => onModeChange('SHOW_ALL')}
                />
                <RadioCard
                    selected={mode === 'FILTER'}
                    label={i18n.t('Filter')}
                    value="FILTER"
                    name={radioGroupName}
                    dataTest={`${dataTest}-filter`}
                    onSelect={() => onModeChange('FILTER')}
                    disabled={filterDisabled}
                    helpText={filterDisabled ? filterDisabledHelp : undefined}
                >
                    {children}
                </RadioCard>
            </RadioCards>
        </FieldSet>
    )
}
