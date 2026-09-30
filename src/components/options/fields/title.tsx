import i18n from '@dhis2/d2-i18n'
import { Field, InputField, Radio } from '@dhis2/ui'
import { useOptionsField } from '@hooks'
import { isPopulatedString } from '@modules/utils/guards'
import { useCallback, useState, type FC } from 'react'
import classes from './styles/option.module.css'

type TitleMode = 'AUTO' | 'NONE' | 'CUSTOM'

const getStoredMode = (
    title: string | undefined,
    hideTitle: boolean | undefined
): TitleMode => {
    if (hideTitle) {
        return 'NONE'
    }
    return isPopulatedString(title) ? 'CUSTOM' : 'AUTO'
}

type TitleProps = {
    label: string
}

/* Auto is stored as an empty title, so a custom title typed and then toggled
 * away from can't stay in the options without reading back as Custom. It is
 * kept in local state instead, and dropped when the field unmounts. */
export const Title: FC<TitleProps> = ({ label }) => {
    const [title, setTitle] = useOptionsField('title')
    const [hideTitle, setHideTitle] = useOptionsField('hideTitle')

    const [mode, setMode] = useState<TitleMode>(() =>
        getStoredMode(title, hideTitle)
    )
    const [customTitle, setCustomTitle] = useState<string>(title ?? '')

    const onModeChange = useCallback(
        (nextMode: TitleMode) => {
            setMode(nextMode)
            setHideTitle(nextMode === 'NONE')
            setTitle(nextMode === 'CUSTOM' ? customTitle : '')
        },
        [customTitle, setHideTitle, setTitle]
    )

    const onCustomTitleChange = useCallback(
        (value: string) => {
            setCustomTitle(value)
            setTitle(value)
        },
        [setTitle]
    )

    return (
        <Field name="title" label={label}>
            <Radio
                dense
                name="titleMode"
                label={i18n.t('Auto generated')}
                checked={mode === 'AUTO'}
                onChange={() => onModeChange('AUTO')}
                dataTest="title-mode-auto"
            />
            <Radio
                dense
                name="titleMode"
                label={i18n.t('None')}
                checked={mode === 'NONE'}
                onChange={() => onModeChange('NONE')}
                dataTest="title-mode-none"
            />
            <Radio
                dense
                name="titleMode"
                label={i18n.t('Custom')}
                checked={mode === 'CUSTOM'}
                onChange={() => onModeChange('CUSTOM')}
                dataTest="title-mode-custom"
            />
            {mode === 'CUSTOM' && (
                <div className={classes.optionToggleable}>
                    <InputField
                        dense
                        name="title"
                        inputWidth="280px"
                        placeholder={i18n.t('Add a title')}
                        value={customTitle}
                        onChange={({ value }) =>
                            onCustomTitleChange(value ?? '')
                        }
                        dataTest="title-input"
                    />
                </div>
            )}
        </Field>
    )
}
