import { useDimensionDialogAnchor } from '@components/dimension-dialog/anchor-context'
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { useAppDispatch, useAppStore } from '@hooks'
import {
    getUiDimensionDialogMode,
    setUiActiveDimensionModal,
} from '@store/ui-slice'
import { useCallback, type FC, type PropsWithChildren } from 'react'
import { collisionDetector } from './collision-detector'
import { DimensionDragOverlay } from './dimension-drag-overlay'
import { useOnDragEnd } from './use-on-drag-end'

const activateAt15pixels = {
    activationConstraint: {
        distance: 15,
    },
}

export const DndContextProvider: FC<PropsWithChildren> = ({ children }) => {
    // Wait 15px movement before starting drag, so that click event isn't overridden
    const sensor = useSensor(PointerSensor, activateAt15pixels)
    const sensors = useSensors(sensor)
    const onDragEnd = useOnDragEnd()
    const dispatch = useAppDispatch()
    const store = useAppStore()
    const { setAnchorEl } = useDimensionDialogAnchor()
    const onDragStart = useCallback(() => {
        const mode = getUiDimensionDialogMode(store.getState())
        if (mode === 'popover') {
            dispatch(setUiActiveDimensionModal(null))
            setAnchorEl(null)
        }
    }, [dispatch, setAnchorEl, store])

    return (
        <DndContext
            collisionDetection={collisionDetector}
            sensors={sensors}
            onDragEnd={onDragEnd}
            onDragStart={onDragStart}
        >
            {children}
            <DimensionDragOverlay />
        </DndContext>
    )
}
