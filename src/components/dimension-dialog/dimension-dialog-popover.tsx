import { Layer, Popper } from '@dhis2/ui'
import type { DimensionDialogOriginType } from '@store/ui-slice'
import { useEffect, type FC, type ReactNode } from 'react'
import { useDimensionDialogAnchor } from './anchor-context'
import classes from './styles/dimension-dialog.module.css'

type DimensionDialogPopoverProps = {
    onClose: () => void
    originType: DimensionDialogOriginType | null
    children: ReactNode
}

export const DimensionDialogPopover: FC<DimensionDialogPopoverProps> = ({
    onClose,
    originType,
    children,
}) => {
    const { anchorEl } = useDimensionDialogAnchor()

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation()
                onClose()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    useEffect(() => {
        if (!anchorEl) {
            return
        }
        const observer = new MutationObserver(() => {
            if (!document.contains(anchorEl)) {
                onClose()
            }
        })
        observer.observe(document.body, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [anchorEl, onClose])

    if (!anchorEl) {
        return null
    }

    const placement = originType === 'chip' ? 'bottom-start' : 'right-start'

    return (
        <Layer onBackdropClick={onClose}>
            <Popper reference={anchorEl} placement={placement}>
                <div
                    className={classes.popoverContainer}
                    role="dialog"
                    data-test="dimension-dialog-popover"
                >
                    {children}
                </div>
            </Popper>
        </Layer>
    )
}
