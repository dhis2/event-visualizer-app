import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import { CheckboxBaseOption } from './checkbox-base-option'

export const ColSubTotals: FC = () => (
    <CheckboxBaseOption
        label={i18n.t('Column sub-totals')}
        option={{
            name: 'colSubTotals',
        }}
    />
)
