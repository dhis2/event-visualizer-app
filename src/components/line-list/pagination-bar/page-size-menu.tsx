import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconMore16,
    Popover,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import { useEffect, useRef, useState, type FC } from 'react'
import classes from './styles/pagination-bar.module.css'

const PAGE_SIZES = [5, 10, 15, 20, 25, 50, 100]

type PageSizeMenuProps = {
    pageSize: number
    disabled: boolean
    onChange: (pageSize: number) => void
}

export const PageSizeMenu: FC<PageSizeMenuProps> = ({
    pageSize,
    disabled,
    onChange,
}) => {
    const anchorRef = useRef<HTMLDivElement | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (!isOpen) {
            return
        }
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }
        document.addEventListener('keydown', onEscape)
        return () => document.removeEventListener('keydown', onEscape)
    }, [isOpen])

    return (
        <div className={classes.menuAnchor} ref={anchorRef}>
            <Button
                small
                secondary
                icon={<IconMore16 />}
                aria-label={i18n.t('Pagination options')}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                disabled={disabled}
                onClick={() => setIsOpen((open) => !open)}
                dataTest="pagination-options"
            />
            {isOpen && (
                <Popover
                    reference={anchorRef}
                    placement="top-end"
                    arrow={false}
                    onClickOutside={() => setIsOpen(false)}
                >
                    <div className={classes.pageSizePopover}>
                        <SingleSelectField
                            dense
                            label={i18n.t('Rows per page (view only)')}
                            selected={String(pageSize)}
                            onChange={({ selected }) => {
                                setIsOpen(false)
                                const newPageSize = Number(selected)
                                if (newPageSize !== pageSize) {
                                    onChange(newPageSize)
                                }
                            }}
                            dataTest="pagination-page-size-select"
                        >
                            {PAGE_SIZES.map((size) => (
                                <SingleSelectOption
                                    key={size}
                                    label={String(size)}
                                    value={String(size)}
                                />
                            ))}
                        </SingleSelectField>
                    </div>
                </Popover>
            )}
        </div>
    )
}
