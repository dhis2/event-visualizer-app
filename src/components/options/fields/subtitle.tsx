import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import { TextBaseOption } from './text-base-option'

type SubtitleProps = {
    label: string
    dataTest?: string
}

export const Subtitle: FC<SubtitleProps> = ({
    dataTest = 'visualization-option-subtitle',
    label,
}) => (
    <TextBaseOption
        type="text"
        width="280px"
        placeholder={i18n.t('Add a subtitle')}
        label={label}
        option={{
            name: 'subtitle',
        }}
        dataTest={dataTest}
    />
)
