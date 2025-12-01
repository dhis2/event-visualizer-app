import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import { CheckboxBaseOption } from './checkbox-base-option'

export const ColTotals: FC = () => (
    <CheckboxBaseOption
        label={i18n.t('Column totals')}
        option={{
            name: 'colTotals',
        }}
    />
)
