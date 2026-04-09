import i18n from '@dhis2/d2-i18n'
import { useOptionsField } from '@hooks'
import { type FC } from 'react'
import { CheckboxBaseOption } from './checkbox-base-option'

export const RowSubTotals: FC = () => {
    const [cumulativeValues] = useOptionsField('cumulativeValues')

    return (
        <CheckboxBaseOption
            label={i18n.t('Row sub-totals')}
            option={{
                name: 'rowSubTotals',
            }}
            disabled={cumulativeValues}
        />
    )
}
