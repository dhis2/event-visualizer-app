import i18n from '@dhis2/d2-i18n'
import {
    CircularLoader,
    IconErrorFilled16,
    IconSearch16,
    theme,
} from '@dhis2/ui'
import cx from 'classnames'
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ChangeEventHandler,
} from 'react'
import { useDebounceCallback, useDebounceValue } from 'usehooks-ts'
import classes from './styles/unified-search-input.module.css'
import { useAppSelector, useAppStore } from '@hooks'
import {
    getAllListLoadErrors,
    isAnyListLoading,
    setSearchTerm,
} from '@store/dimensions-selection-slice'

const DEBOUNCE_TIME_SEARCH_TERM = 250
const DEBOUNCE_TIME_LOADER = 250
const DEBOUNCE_TIME_HELPMESSAGE = 2000
const MIN_SEARCH_TERM_LENGTH = 2
const SEARCH_ERROR_ID = 'search-error'
const SEARCH_HELP_ID = 'search-help'

const isValidSearchTerm = (searchTerm: string) =>
    searchTerm.length === 0 || searchTerm.length >= MIN_SEARCH_TERM_LENGTH

export const UnifiedSearchInput = () => {
    const store = useAppStore()
    const isLoading = useAppSelector(isAnyListLoading)
    const errors = useAppSelector(getAllListLoadErrors)
    const [text, setText] = useState(() => {
        const state = store.getState()
        return state.dimensionSelection.searchTerm
    })
    const [helpMessage, setHelpMessage] = useState<string | undefined>(
        undefined
    )
    const [debouncedSearchTerm] = useDebounceValue(
        text,
        DEBOUNCE_TIME_SEARCH_TERM
    )
    const [debouncedIsLoading] = useDebounceValue(
        isLoading,
        DEBOUNCE_TIME_LOADER
    )
    const debouncedSetHelpMessage = useDebounceCallback(
        setHelpMessage,
        DEBOUNCE_TIME_HELPMESSAGE
    )
    const onChange: ChangeEventHandler<HTMLInputElement> = useCallback(
        (event) => {
            const { value } = event.target
            setText(value)
            if (!isValidSearchTerm(value)) {
                debouncedSetHelpMessage(
                    i18n.t('Enter at least {{count}} characters to search', {
                        count: MIN_SEARCH_TERM_LENGTH,
                    })
                )
            } else {
                setHelpMessage(undefined)
                debouncedSetHelpMessage.cancel()
            }
        },
        [debouncedSetHelpMessage]
    )
    const errorMessage = useMemo<string | undefined>(() => {
        // TODO: Could not get the i18n pluralization to work here
        switch (errors.length) {
            case 0:
                return undefined
            case 1:
                return i18n.t('There was a problem trying to search')
            default:
                return i18n.t(
                    'There were {{errorsLength}} problems trying to search',
                    { errorsLength: errors.length }
                )
        }
    }, [errors.length])
    const describedBy = useMemo(() => {
        const messages: string[] = []

        if (errorMessage) {
            messages.push(SEARCH_ERROR_ID)
        }
        if (helpMessage) {
            messages.push(SEARCH_HELP_ID)
        }

        return messages.length === 0 ? undefined : messages.join(' ')
    }, [errorMessage, helpMessage])

    useEffect(() => {
        const state = store.getState()
        const currentSearchTerm = state.dimensionSelection.searchTerm

        if (
            isValidSearchTerm(debouncedSearchTerm) &&
            currentSearchTerm !== debouncedSearchTerm
        ) {
            store.dispatch(setSearchTerm(debouncedSearchTerm))
        }
    }, [store, debouncedSearchTerm])

    return (
        <div className={classes.container}>
            <div className={classes.inputWrap}>
                <input
                    type="search"
                    value={text}
                    placeholder={i18n.t('Search')}
                    onChange={onChange}
                    aria-describedby={describedBy}
                    data-test="unified-search-input"
                    className={cx(classes.input, {
                        [classes.error]: !!errorMessage,
                        [classes.loading]: debouncedIsLoading,
                    })}
                />
                <span className={classes.searchIcon} aria-hidden="true">
                    <IconSearch16 />
                </span>
                {debouncedIsLoading && (
                    <span
                        className={classes.statusIcon}
                        aria-hidden="true"
                        data-test="search-loader"
                    >
                        <CircularLoader extrasmall />
                    </span>
                )}
                {!!errorMessage && (
                    <span
                        className={classes.statusIcon}
                        aria-hidden="true"
                        data-test="search-error-icon"
                    >
                        <IconErrorFilled16 color={theme.error} />
                    </span>
                )}
            </div>
            {!!errorMessage && (
                <div
                    id={SEARCH_ERROR_ID}
                    className={cx(classes.help, classes.errorHelp)}
                    data-test="search-error-message"
                >
                    {errorMessage}
                </div>
            )}
            {!!helpMessage && (
                <div
                    id={SEARCH_HELP_ID}
                    className={classes.help}
                    data-test="search-help-message"
                >
                    {helpMessage}
                </div>
            )}
        </div>
    )
}
