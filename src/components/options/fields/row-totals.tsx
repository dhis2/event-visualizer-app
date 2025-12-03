import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import { CheckboxBaseOption } from './checkbox-base-option'
import { useOptionsField } from '@hooks'

export const RowTotals: FC = () => {
    const [cumulativeValues] = useOptionsField('cumulativeValues')

    return (
        <CheckboxBaseOption
            label={i18n.t('Row totals')}
            option={{
                name: 'rowTotals',
            }}
            disabled={cumulativeValues}
        />
    )
}
