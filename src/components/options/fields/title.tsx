import i18n from '@dhis2/d2-i18n'
import { type FC } from 'react'
import { TextBaseOption } from './text-base-option'

type TitleProps = {
    label: string
}

export const Title: FC<TitleProps> = ({ label }) => (
    <TextBaseOption
        type="text"
        inputWidth="280px"
        label={label}
        placeholder={i18n.t('Add a title')}
        option={{
            name: 'title',
        }}
    />
)
