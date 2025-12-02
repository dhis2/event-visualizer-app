import i18n from '@dhis2/d2-i18n'
import type { FC } from 'react'
import classes from './styles/tabs.module.css'
import { SkipRounding } from '@components/options/fields/skip-rounding'

export const LineListDataTab: FC = () => (
    <div className={classes.section} data-test="line-list-data-tab">
        <span className={classes.subSectionTitle}>{i18n.t('Display')}</span>
        <SkipRounding />
    </div>
)
