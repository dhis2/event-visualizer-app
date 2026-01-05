import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import { CheckboxBaseOption } from './checkbox-base-option'
import { useOptionsField } from '@hooks'

export const ColTotals: FC = () => {
    const [cumulativeValues] = useOptionsField('cumulativeValues')

    return (
        <CheckboxBaseOption
            label={i18n.t('Column totals')}
            option={{
                name: 'colTotals',
            }}
            disabled={cumulativeValues}
        />
    )
}
