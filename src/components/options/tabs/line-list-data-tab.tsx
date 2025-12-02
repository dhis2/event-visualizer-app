import i18n from '@dhis2/d2-i18n'
import type { FC } from 'react'
import classes from './styles/tabs.module.css'
import { SkipRounding } from '@components/options/fields/skip-rounding'
import { OptionsFieldSet } from '@components/options/options-fieldset'

export const LineListDataTab: FC = () => (
    <div className={classes.tab} data-test="line-list-data-tab">
        <OptionsFieldSet title={i18n.t('Display')}>
            <SkipRounding />
        </OptionsFieldSet>
    </div>
)
