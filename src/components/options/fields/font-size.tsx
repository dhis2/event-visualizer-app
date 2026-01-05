import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import { SelectBaseOption } from './select-base-option'

export const FontSize: FC = () => (
    <SelectBaseOption
        label={i18n.t('Font size')}
        option={{
            name: 'fontSize',
            items: [
                { value: 'LARGE', label: i18n.t('Large') },
                { value: 'NORMAL', label: i18n.t('Normal') },
                { value: 'SMALL', label: i18n.t('Small') },
            ],
        }}
    />
)
