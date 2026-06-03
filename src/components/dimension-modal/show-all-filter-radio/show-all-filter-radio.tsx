import i18n from '@dhis2/d2-i18n'
import { FieldSet, Legend, Radio } from '@dhis2/ui'
import { type FC, type PropsWithChildren } from 'react'
import classes from './styles/show-all-filter-radio.module.css'

export type FilterRadioMode = 'SHOW_ALL' | 'FILTER'

type ShowAllFilterRadioProps = PropsWithChildren<{
    mode: FilterRadioMode
    onModeChange: (mode: FilterRadioMode) => void
    dataTest?: string
}>

export const ShowAllFilterRadio: FC<ShowAllFilterRadioProps> = ({
    mode,
    onModeChange,
    dataTest = 'show-all-filter-radio',
    children,
}) => (
    <FieldSet>
        <Legend>
            <span className={classes.visuallyHidden}>
                {i18n.t('Value filtering')}
            </span>
        </Legend>
        <div className={classes.radios}>
            <Radio
                name={dataTest}
                label={i18n.t('Show all')}
                value="SHOW_ALL"
                checked={mode === 'SHOW_ALL'}
                onChange={() => onModeChange('SHOW_ALL')}
                dense
                dataTest={`${dataTest}-show-all`}
            />
            <Radio
                name={dataTest}
                label={i18n.t('Filter')}
                value="FILTER"
                checked={mode === 'FILTER'}
                onChange={() => onModeChange('FILTER')}
                dense
                dataTest={`${dataTest}-filter`}
            />
        </div>
        {mode === 'FILTER' && (
            <div className={classes.revealed}>{children}</div>
        )}
    </FieldSet>
)
