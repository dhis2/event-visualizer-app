import i18n from '@dhis2/d2-i18n'
import { Field, InputField, Radio } from '@dhis2/ui'
import { useOptionsField } from '@hooks'
import { isPopulatedString } from '@modules/utils/guards'
import { useCallback, useState, type FC } from 'react'
import classes from './styles/title.module.css'

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

/* The mode is derived from `title` and `hideTitle` rather than stored, so a
 * custom title typed and then toggled away from has nowhere persistent to
 * live. Keeping it here means it survives toggling while the modal is open
 * and is discarded when the modal unmounts, which is what the spec asks for. */
export const Title: FC<TitleProps> = ({ label }) => {
    const [title, setTitle] = useOptionsField('title')
    const [hideTitle, setHideTitle] = useOptionsField('hideTitle')

    const [mode, setMode] = useState<TitleMode>(() =>
        getStoredMode(title, hideTitle)
    )
    const [draft, setDraft] = useState<string>(title ?? '')

    const applyMode = useCallback(
        (nextMode: TitleMode) => {
            setMode(nextMode)
            setHideTitle(nextMode === 'NONE')
            setTitle(nextMode === 'CUSTOM' ? draft : '')
        },
        [draft, setHideTitle, setTitle]
    )

    const applyDraft = useCallback(
        (value: string) => {
            setDraft(value)
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
                onChange={() => applyMode('AUTO')}
                dataTest="title-mode-auto"
            />
            <Radio
                dense
                name="titleMode"
                label={i18n.t('None')}
                checked={mode === 'NONE'}
                onChange={() => applyMode('NONE')}
                dataTest="title-mode-none"
            />
            <Radio
                dense
                name="titleMode"
                label={i18n.t('Custom')}
                checked={mode === 'CUSTOM'}
                onChange={() => applyMode('CUSTOM')}
                dataTest="title-mode-custom"
            />
            {mode === 'CUSTOM' && (
                <div className={classes.customInput}>
                    <InputField
                        dense
                        name="title"
                        inputWidth="280px"
                        placeholder={i18n.t('Add a title')}
                        value={draft}
                        onChange={({ value }) => applyDraft(value ?? '')}
                        dataTest="title-input"
                    />
                </div>
            )}
        </Field>
    )
}
