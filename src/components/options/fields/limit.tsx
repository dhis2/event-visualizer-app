import i18n from '@dhis2/d2-i18n'
import { Checkbox, InputField } from '@dhis2/ui'
import { useOptionsField } from '@hooks'
import {
    useCallback,
    useMemo,
    useState,
    type FC,
    type KeyboardEvent,
} from 'react'
import { SelectBaseOption } from './select-base-option'
import classes from './styles/option.module.css'

export const Limit: FC = () => {
    const [sortOrder, setSortOrder] = useOptionsField('sortOrder')
    const [topLimit, setTopLimit] = useOptionsField('topLimit')

    const isLimitEnabled = useMemo(
        () => sortOrder !== undefined && topLimit !== undefined,
        [sortOrder, topLimit]
    )

    const onChange = useCallback(
        ({ checked }: { checked: boolean }) => {
            setSortOrder(checked ? -1 : undefined)
            setTopLimit(checked ? 10 : undefined)
        },
        [setSortOrder, setTopLimit]
    )

    return (
        <div>
            <Checkbox
                checked={isLimitEnabled}
                label={i18n.t('Limit')}
                name="limitEnabled"
                onChange={onChange}
                dense
            />
            {isLimitEnabled && (
                <div className={classes.optionToggleable}>
                    <SortOrder />
                    <TopLimit />
                </div>
            )}
        </div>
    )
}

const SortOrder: FC = () => (
    <SelectBaseOption
        label={i18n.t('Sort order')}
        option={{
            name: 'sortOrder',
            items: [
                { value: '-1', label: i18n.t('Low to high') },
                { value: '1', label: i18n.t('High to low') },
            ],
        }}
    />
)

const parseTopLimit = (value: string): number | undefined => {
    const parsed = Number(value)

    return value.trim() !== '' && Number.isInteger(parsed) && parsed >= 1
        ? parsed
        : undefined
}

/* The typed text stays local until the edit ends, so the store only ever holds
 * a usable limit and text that never parses is simply dropped. Both ways of
 * ending an edit run ahead of the submit they trigger: the Update button's
 * mousedown blurs the input before its click, and the Enter keydown is handled
 * before the implicit submission that is its default action. */
const TopLimit: FC = () => {
    const [topLimit, setTopLimit] = useOptionsField('topLimit')
    const [draft, setDraft] = useState<string>()

    const parsedDraft = draft === undefined ? undefined : parseTopLimit(draft)
    const isInvalid = draft !== undefined && parsedDraft === undefined

    const commitDraft = useCallback(() => {
        if (parsedDraft !== undefined) {
            setTopLimit(parsedDraft)
        }
        setDraft(undefined)
    }, [parsedDraft, setTopLimit])

    const commitOnEnter = useCallback(
        (_payload: unknown, event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key !== 'Enter') {
                return
            }

            if (isInvalid) {
                event.preventDefault()
            } else {
                commitDraft()
            }
        },
        [isInvalid, commitDraft]
    )

    return (
        <div>
            <InputField
                label={i18n.t('Top limit')}
                name="topLimit"
                type="number"
                min="1"
                step="1"
                value={draft ?? String(topLimit ?? '')}
                error={isInvalid}
                validationText={
                    isInvalid
                        ? i18n.t('Enter a whole number of 1 or higher')
                        : undefined
                }
                onChange={({ value = '' }: { value?: string }) =>
                    setDraft(value)
                }
                onBlur={commitDraft}
                onKeyDown={commitOnEnter}
                inputWidth="280px"
                dense
                dataTest="topLimit-input"
            />
        </div>
    )
}
