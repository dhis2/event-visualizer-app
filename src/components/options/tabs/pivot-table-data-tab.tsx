import i18n from '@dhis2/d2-i18n'
import { FieldSet } from '@dhis2/ui'
import type { FC } from 'react'
import classes from './styles/tabs.module.css'
import { ColSubTotals } from '@components/options/fields/col-sub-totals'
import { ColTotals } from '@components/options/fields/col-totals'
import { HideEmptyRows } from '@components/options/fields/hide-empty-rows'
import { HideNaData } from '@components/options/fields/hide-na-data'
import { RowSubTotals } from '@components/options/fields/row-sub-totals'
import { RowTotals } from '@components/options/fields/row-totals'
import { ShowDimensionLabels } from '@components/options/fields/show-dimension-labels'
import { SkipRounding } from '@components/options/fields/skip-rounding'

export const PivotTableDataTab: FC = () => (
    <div className={classes.section} data-test="pivot-table-data-tab">
        <ShowDimensionLabels />
        <SkipRounding />
        <FieldSet>
            <ColTotals />
            <ColSubTotals />
            <RowTotals />
            <RowSubTotals />
        </FieldSet>
        <span className={classes.sectionTitle}>{i18n.t('Empty data')}</span>
        <HideEmptyRows />
        <HideNaData />
    </div>
)
