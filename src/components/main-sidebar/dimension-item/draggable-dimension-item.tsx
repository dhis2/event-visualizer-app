import { IconAdd16, IconSubtract16 } from '@dhis2/ui'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, type FC } from 'react'
import { DimensionItem } from './dimension-item'
import { DimensionItemContainer } from './dimension-item-container'
import styles from './styles/draggable-dimension-item.module.css'
import type { SidebarSortableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import { useIsDimensionInLayout } from '@components/main-sidebar/use-is-dimension-in-layout'
import { IconButton } from '@components/shared/icon-button'
import { useAddMetadata, useAppDispatch } from '@hooks'
import { setUiActiveDimensionModal } from '@store/ui-slice'
import {
    addVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimension,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem, Program, ProgramStage } from '@types'

interface DraggableDimensionItemProps {
    dimension: DimensionMetadataItem
    program?: Program
    programStage?: ProgramStage
    draggableId?: string
    disabled?: boolean
}

export const DraggableDimensionItem: FC<DraggableDimensionItemProps> = ({
    dimension,
    program,
    programStage,
    draggableId,
    disabled,
}) => {
    const dispatch = useAppDispatch()
    const addMetadata = useAddMetadata()
    const selected = useIsDimensionInLayout(dimension.id)

    const populateMetadata = useCallback(() => {
        if (program) {
            addMetadata(program)
        }
        if (programStage) {
            addMetadata(programStage)
        }
        if (program?.trackedEntityType) {
            addMetadata(program.trackedEntityType)
        }
        addMetadata(dimension)
    }, [addMetadata, dimension, program, programStage])

    const handleOpen = useCallback(() => {
        populateMetadata()
        dispatch(setUiActiveDimensionModal(dimension.id))
    }, [dispatch, dimension.id, populateMetadata])

    const handleAddRemove = useCallback(() => {
        if (selected) {
            dispatch(
                removeVisUiConfigLayoutDimension({ dimensionId: dimension.id })
            )
        } else {
            populateMetadata()
            dispatch(
                addVisUiConfigLayoutDimension({
                    axis: 'columns',
                    dimensionId: dimension.id,
                })
            )
        }
    }, [dimension.id, populateMetadata, dispatch, selected])

    const droppableData: SidebarSortableData = {
        dimensionId: dimension.id,
        overlayItemProps: {
            dimensionType: dimension.dimensionType,
            dimensionName: dimension.name,
            itemsText: '',
            onClick: () => undefined,
        },
        populateMetadata,
    }

    const {
        attributes,
        isDragging,
        listeners,
        isSorting,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id: draggableId ?? dimension.id,
        disabled: disabled || selected,
        data: droppableData,
    })

    const style = transform
        ? {
              transform: isSorting
                  ? undefined
                  : CSS.Translate.toString({
                        x: transform.x,
                        y: transform.y,
                        scaleX: 1,
                        scaleY: 1,
                    }),
              transition,
          }
        : undefined

    return (
        <DimensionItemContainer
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            aria-roledescription="draggable item"
            selected={selected}
            disabled={disabled}
            isDragging={isDragging}
        >
            <div className={styles.content}>
                <DimensionItem
                    name={dimension.name}
                    dimensionType={dimension.dimensionType}
                    selected={selected}
                    disabled={disabled || selected}
                    onClick={handleOpen}
                />
                {!disabled && (
                    <div className={styles.iconButtonWrapper}>
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation()
                                handleAddRemove()
                            }}
                            dataTest={
                                selected
                                    ? `subtract-button-${dimension.id}`
                                    : `add-button-${dimension.id}`
                            }
                        >
                            {selected ? (
                                <IconSubtract16 />
                            ) : (
                                <IconAdd16 color="var(--colors-grey600)" />
                            )}
                        </IconButton>
                    </div>
                )}
            </div>
        </DimensionItemContainer>
    )
}
