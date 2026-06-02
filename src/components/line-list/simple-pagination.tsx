import i18n from '@dhis2/d2-i18n'
import {
    Button,
    FlyoutMenu,
    IconChevronLeft16,
    IconChevronRight16,
    IconMore16,
    MenuItem,
} from '@dhis2/ui'
import { useEffect, useRef, useState, type FC } from 'react'
import classes from './styles/simple-pagination.module.css'

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100, 200, 500]

type SimplePaginationProps = {
    page: number
    pageSize: number
    isLastPage: boolean
    pageLength: number
    disabled: boolean
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
}

export const SimplePagination: FC<SimplePaginationProps> = ({
    page,
    pageSize,
    isLastPage,
    pageLength,
    disabled,
    onPageChange,
    onPageSizeChange,
}) => {
    const [menuOpen, setMenuOpen] = useState(false)
    const menuAnchorRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (!menuOpen) {
            return
        }
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!menuAnchorRef.current?.contains(event.target as Node)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', closeOnOutsideClick)
        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick)
        }
    }, [menuOpen])

    const firstItem = (page - 1) * pageSize + 1
    const lastItem = (page - 1) * pageSize + pageLength

    return (
        <div className={classes.bar}>
            <div className={classes.pageControls}>
                <Button
                    small
                    secondary
                    disabled={disabled || page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    icon={<IconChevronLeft16 />}
                    aria-label={i18n.t('Go to previous page')}
                />
                <span
                    className={classes.page}
                    data-test="line-list-pagination-page"
                >
                    {page}
                </span>
                <Button
                    small
                    secondary
                    disabled={disabled || isLastPage}
                    onClick={() => onPageChange(page + 1)}
                    icon={<IconChevronRight16 />}
                    aria-label={i18n.t('Go to next page')}
                />
            </div>

            <span className={classes.summary}>
                {i18n.t('Rows {{- firstItem}}-{{- lastItem}}', {
                    firstItem,
                    lastItem,
                })}
            </span>

            <span ref={menuAnchorRef} className={classes.menuAnchor}>
                <Button
                    small
                    secondary
                    disabled={disabled}
                    onClick={() => setMenuOpen((open) => !open)}
                    icon={<IconMore16 />}
                    aria-label={i18n.t('Rows per page')}
                />
                {menuOpen && (
                    <div className={classes.menu}>
                        <FlyoutMenu>
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <MenuItem
                                    key={size}
                                    label={String(size)}
                                    active={size === pageSize}
                                    onClick={() => {
                                        onPageSizeChange(size)
                                        setMenuOpen(false)
                                    }}
                                />
                            ))}
                        </FlyoutMenu>
                    </div>
                )}
            </span>
        </div>
    )
}
