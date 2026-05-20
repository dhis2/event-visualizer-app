import { Layer } from '@dhis2/ui'
import { useEffect, type FC, type ReactNode } from 'react'
import classes from './styles/dimension-dialog.module.css'

type DimensionDialogModalProps = {
    onClose: () => void
    children: ReactNode
}

export const DimensionDialogModal: FC<DimensionDialogModalProps> = ({
    onClose,
    children,
}) => {
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

    return (
        <Layer translucent onBackdropClick={onClose}>
            <div
                className={classes.modalContainer}
                role="dialog"
                aria-modal="true"
                data-test="dimension-dialog-modal"
            >
                {children}
            </div>
        </Layer>
    )
}
