import i18n from '@dhis2/d2-i18n'
import type { FC } from 'react'
import classes from './styles/tabs.module.css'
import { ColSubTotals } from '@components/options/fields/col-sub-totals'
import { ColTotals } from '@components/options/fields/col-totals'
import { CumulativeValues } from '@components/options/fields/cumulative-values'
import { HideEmptyRows } from '@components/options/fields/hide-empty-rows'
import { HideNaData } from '@components/options/fields/hide-na-data'
import { Limit } from '@components/options/fields/limit'
import { RowSubTotals } from '@components/options/fields/row-sub-totals'
import { RowTotals } from '@components/options/fields/row-totals'
import { ShowDimensionLabels } from '@components/options/fields/show-dimension-labels'
import { SkipRounding } from '@components/options/fields/skip-rounding'
import { OptionsFieldSet } from '@components/options/options-fieldset'
import { useOptionsField } from '@hooks'

export const PivotTableDataTab: FC = () => {
    const [cumulativeValues] = useOptionsField('cumulativeValues')

    return (
        <div className={classes.tab} data-test="pivot-table-data-tab">
            <OptionsFieldSet title={i18n.t('Display')}>
                <CumulativeValues />
                <ShowDimensionLabels />
                <SkipRounding />
            </OptionsFieldSet>
            <OptionsFieldSet
                title={i18n.t('Totals')}
                helpText={
                    cumulativeValues
                        ? i18n.t(
                              'Totals are not supported when using cumulative values'
                          )
                        : undefined
                }
            >
                <ColTotals />
                <ColSubTotals />
                <RowTotals />
                <RowSubTotals />
            </OptionsFieldSet>
            <OptionsFieldSet title={i18n.t('Empty data')}>
                <HideEmptyRows />
                <HideNaData />
            </OptionsFieldSet>
            <OptionsFieldSet>
                <Limit />
            </OptionsFieldSet>
        </div>
    )
}
