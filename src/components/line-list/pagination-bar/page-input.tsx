import i18n from '@dhis2/d2-i18n'
import cx from 'classnames'
import {
    useCallback,
    useRef,
    useState,
    type CSSProperties,
    type FC,
    type KeyboardEvent,
} from 'react'
import { clampPage } from './pager'
import classes from './styles/pagination-bar.module.css'

type PageInputProps = {
    page: number
    pageCount?: number
    disabled: boolean
    className?: string
    style: CSSProperties
    onCommit: (page: number) => void
}

export const PageInput: FC<PageInputProps> = ({
    page,
    pageCount,
    disabled,
    className,
    style,
    onCommit,
}) => {
    const [draft, setDraft] = useState<string | null>(null)
    /* Escape blurs the input, and the blur runs before React has cleared the
     * draft, so it must know not to commit. */
    const isCancellingRef = useRef(false)

    const commit = useCallback(() => {
        if (isCancellingRef.current) {
            isCancellingRef.current = false
            return
        }
        if (draft === null) {
            return
        }
        setDraft(null)
        const typedPage = Number.parseInt(draft, 10)
        if (Number.isNaN(typedPage)) {
            return
        }
        const targetPage = clampPage(typedPage, pageCount)
        if (targetPage !== page) {
            onCommit(targetPage)
        }
    }, [draft, page, pageCount, onCommit])

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            const input = event.currentTarget
            if (event.key === 'Enter') {
                commit()
                requestAnimationFrame(() => input.select())
            } else if (event.key === 'Escape') {
                isCancellingRef.current = true
                setDraft(null)
                input.blur()
            }
        },
        [commit]
    )

    return (
        <input
            className={cx(classes.pageInput, className)}
            style={style}
            type="text"
            inputMode="numeric"
            aria-label={i18n.t('Page number')}
            disabled={disabled}
            value={draft ?? String(page)}
            onFocus={(event) => {
                setDraft(String(page))
                event.currentTarget.select()
            }}
            onChange={(event) =>
                setDraft(event.target.value.replaceAll(/\D/g, ''))
            }
            onKeyDown={onKeyDown}
            onBlur={commit}
            data-test="pagination-page-input"
        />
    )
}
