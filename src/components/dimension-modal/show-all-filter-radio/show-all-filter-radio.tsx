import {
    RadioCard,
    RadioCardGroup,
} from '@components/shared/radio-card/radio-card'
import i18n from '@dhis2/d2-i18n'
import { type FC, type PropsWithChildren } from 'react'

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
}>

export const ShowAllFilterRadio: FC<ShowAllFilterRadioProps> = ({
    mode,
    onModeChange,
    dataTest = 'show-all-filter-radio',
    filterDisabled = false,
    filterDisabledHelp,
    heading,
    showAllLabel,
    children,
}) => {
    const radioGroupName = `${dataTest}-mode`

    return (
        <RadioCardGroup
            legend={heading ?? i18n.t('Value filtering')}
            hideLegend={!heading}
        >
            <RadioCard
                selected={mode === 'SHOW_ALL'}
                label={showAllLabel ?? i18n.t('Show all values')}
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
        </RadioCardGroup>
    )
}
