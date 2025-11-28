import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import { SelectBaseOption } from './select-base-option'

export const DigitGroupSeparator: FC = () => (
    <SelectBaseOption
        label={i18n.t('Digit group separator')}
        option={{
            name: 'digitGroupSeparator',
            items: [
                { value: 'NONE', label: i18n.t('None') },
                { value: 'SPACE', label: i18n.t('Space') },
                { value: 'COMMA', label: i18n.t('Comma') },
            ],
        }}
        dataTest="dgs"
    />
)
