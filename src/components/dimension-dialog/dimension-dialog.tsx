import { useAppSelector } from '@hooks'
import {
    getUiActiveDimensionModal,
    getUiDimensionDialogMode,
    getUiDimensionDialogOriginType,
} from '@store/ui-slice'
import type { FC } from 'react'
import { DimensionDialogModal } from './dimension-dialog-modal'
import { DimensionDialogPopover } from './dimension-dialog-popover'
import { DimensionDialogShell } from './dimension-dialog-shell'

type DimensionDialogProps = {
    onClose: () => void
}

export const DimensionDialog: FC<DimensionDialogProps> = ({ onClose }) => {
    const activeDimensionModal = useAppSelector(getUiActiveDimensionModal)
    const mode = useAppSelector(getUiDimensionDialogMode)
    const originType = useAppSelector(getUiDimensionDialogOriginType)

    if (!activeDimensionModal) {
        return null
    }

    if (mode === 'popover' && originType) {
        return (
            <DimensionDialogPopover onClose={onClose} originType={originType}>
                <DimensionDialogShell onClose={onClose} />
            </DimensionDialogPopover>
        )
    }

    return (
        <DimensionDialogModal onClose={onClose}>
            <DimensionDialogShell onClose={onClose} />
        </DimensionDialogModal>
    )
}
