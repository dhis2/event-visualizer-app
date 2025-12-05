import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import { CheckboxBaseOption } from './checkbox-base-option'

export const CumulativeValues: FC = () => {
    return (
        <CheckboxBaseOption
            label={i18n.t('Cumulative values')}
            helpText={i18n.t('Accumulate cell values along rows')}
            option={{
                name: 'cumulativeValues',
            }}
        />
    )
}
