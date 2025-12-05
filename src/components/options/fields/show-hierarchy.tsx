import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import { CheckboxBaseOption } from './checkbox-base-option'

export const ShowHierarchy: FC = () => (
    <CheckboxBaseOption
        label={i18n.t('Display organisation unit hierarchy')}
        option={{
            name: 'showHierarchy',
        }}
    />
)
