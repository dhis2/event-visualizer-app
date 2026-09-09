import i18n from '@dhis2/d2-i18n'
import { Checkbox, InputField } from '@dhis2/ui'
import { useOptionsField } from '@hooks'
import {
    useCallback,
    useMemo,
    useRef,
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

    const toggleLimit = useCallback(
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
                onChange={toggleLimit}
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

/* Digits only: a number input hands "1e3" over as typed, and `Number` reads
 * that as 1000. */
const parseTopLimit = (value: string): number | undefined => {
    if (!/^\d+$/.test(value)) {
        return undefined
    }

    const parsed = Number(value)

    return parsed >= 1 ? parsed : undefined
}

/* Only text that parses reaches the store, so the limit is always usable. An
 * edit ending on text that does not parse is undone back to the snapshot,
 * which is why the snapshot only moves on a valid blur. Blur runs before the
 * submit it triggers, since the Update button's mousedown comes before its
 * click. Enter never blurs, so it is refused while the text is invalid. */
const TopLimit: FC = () => {
    const [topLimit, setTopLimit] = useOptionsField('topLimit')
    const [inputValue, setInputValue] = useState<string>(String(topLimit ?? ''))
    const topLimitSnapshotRef = useRef(topLimit)
    const parsedInputValue = parseTopLimit(inputValue)
    const isInvalid = parsedInputValue === undefined

    const acceptTypedValue = useCallback(
        ({ value = '' }: { value?: string }) => {
            setInputValue(value)

            const parsed = parseTopLimit(value)

            if (parsed !== undefined) {
                setTopLimit(parsed)
            }
        },
        [setTopLimit]
    )

    const createOrResetToSnapshot = useCallback(() => {
        if (parsedInputValue === undefined) {
            setInputValue(String(topLimitSnapshotRef.current))
            setTopLimit(topLimitSnapshotRef.current)
        } else {
            topLimitSnapshotRef.current = parsedInputValue
        }
    }, [parsedInputValue, setTopLimit])

    const refuseImplicitSubmit = useCallback(
        (_payload: unknown, event: KeyboardEvent<HTMLInputElement>) => {
            if (isInvalid && event.key === 'Enter') {
                event.preventDefault()
            }
        },
        [isInvalid]
    )

    return (
        <div>
            <InputField
                label={i18n.t('Top limit')}
                name="topLimit"
                type="number"
                min="1"
                step="1"
                value={inputValue}
                error={isInvalid}
                validationText={
                    isInvalid
                        ? i18n.t('Must be a whole number of 1 or more')
                        : undefined
                }
                onChange={acceptTypedValue}
                onBlur={createOrResetToSnapshot}
                onKeyDown={refuseImplicitSubmit}
                inputWidth="280px"
                dense
                dataTest="topLimit-input"
            />
        </div>
    )
}
