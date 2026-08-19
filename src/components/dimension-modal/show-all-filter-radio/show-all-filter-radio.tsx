import {
    RadioCard,
    RadioCardGroup,
} from '@components/dimension-modal/radio-card/radio-card'
import i18n from '@dhis2/d2-i18n'
import { type FC, type PropsWithChildren } from 'react'
import classes from './styles/show-all-filter-radio.module.css'

export type FilterRadioMode = 'SHOW_ALL' | 'FILTER'

type ShowAllFilterRadioProps = PropsWithChildren<{
    mode: FilterRadioMode
    onModeChange: (mode: FilterRadioMode) => void
    dataTest?: string
    filterDisabled?: boolean
    filterDisabledHelp?: string
    /* Only shown alongside another section, where an unlabelled group of cards
     * would be ambiguous. */
    heading?: string
    showAllLabel?: string
    /* Nested inside a grouping container: no extra fieldset chrome, cards
     * stretch to the container width. */
    nested?: boolean
}>

export const ShowAllFilterRadio: FC<ShowAllFilterRadioProps> = ({
    mode,
    onModeChange,
    dataTest = 'show-all-filter-radio',
    filterDisabled = false,
    filterDisabledHelp,
    heading,
    showAllLabel,
    nested = false,
    children,
}) => {
    const radioGroupName = `${dataTest}-mode`
    const showAllText = showAllLabel ?? i18n.t('Show all values')

    const cards = (
        <RadioCardGroup
            legend={heading ?? i18n.t('Value filtering')}
            hideLegend={!heading}
        >
            <RadioCard
                selected={mode === 'SHOW_ALL'}
                label={showAllText}
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
                flushReveal={nested}
            >
                {children}
            </RadioCard>
        </RadioCardGroup>
    )

    return nested ? <div className={classes.nested}>{cards}</div> : cards
}
