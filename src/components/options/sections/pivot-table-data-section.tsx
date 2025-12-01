import i18n from '@dhis2/d2-i18n'
import type { FC } from 'react'
import classes from './styles/sections.module.css'
import { ColSubTotals } from '@components/options/fields/col-sub-totals'
import { ColTotals } from '@components/options/fields/col-totals'
import { HideEmptyColumns } from '@components/options/fields/hide-empty-columns'
import { HideEmptyRows } from '@components/options/fields/hide-empty-rows'
import { HideNaData } from '@components/options/fields/hide-na-data'
import { RowSubTotals } from '@components/options/fields/row-sub-totals'
import { RowTotals } from '@components/options/fields/row-totals'

export const PivotTableDataSection: FC = () => (
    <div className={classes.section} data-test="pivot-table-data-section">
        <span className={classes.sectionTitle}>{i18n.t('Totals')}</span>
        <ColTotals />
        <ColSubTotals />
        <RowTotals />
        <RowSubTotals />
        <span className={classes.sectionTitle}>{i18n.t('Empty data')}</span>
        <HideEmptyColumns />
        <HideEmptyRows />
        <HideNaData />
    </div>
)
