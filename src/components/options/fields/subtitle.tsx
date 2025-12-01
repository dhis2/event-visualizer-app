import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import { TextBaseOption } from './text-base-option'

type SubtitleProps = {
    label: string
}

export const Subtitle: FC<SubtitleProps> = ({ label }) => (
    <TextBaseOption
        type="text"
        width="280px"
        placeholder={i18n.t('Add a subtitle')}
        label={label}
        option={{
            name: 'subtitle',
        }}
    />
)
