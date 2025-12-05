import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import { CheckboxBaseOption } from './checkbox-base-option'

export const HideNaData: FC = () => (
    <CheckboxBaseOption
        label={i18n.t('Hide N/A data')}
        option={{
            name: 'hideNaData',
        }}
    />
)
