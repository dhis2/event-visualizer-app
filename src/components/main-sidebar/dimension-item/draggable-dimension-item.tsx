import type { SidebarSortableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import { DimensionPopoverCard } from '@components/dimension-modal/dimension-popover-card'
import { useIsDimensionInLayout } from '@components/main-sidebar/use-is-dimension-in-layout'
import { IconButton } from '@components/shared/icon-button'
import { IconAdd16, IconSubtract16, Layer, Popper } from '@dhis2/ui'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAddMetadata, useAppDispatch, useAppSelector } from '@hooks'
import {
    clearMultiSelection,
    isDimensionMultiSelected,
    toggleItemInMultiSelection,
} from '@store/dimensions-selection-slice'
import {
    getUiActiveDimensionPopover,
    setUiActiveDimensionPopover,
} from '@store/ui-slice'
import {
    addVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimension,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem, Program, ProgramStage } from '@types'
import { useCallback, useRef, type FC } from 'react'
import { DimensionItem } from './dimension-item'
import { DimensionItemContainer } from './dimension-item-container'
import styles from './styles/draggable-dimension-item.module.css'

interface DraggableDimensionItemProps {
    dimension: DimensionMetadataItem
    program?: Program
    programStage?: ProgramStage
    disabled?: boolean
}

export const DraggableDimensionItem: FC<DraggableDimensionItemProps> = ({
    dimension,
    program,
    programStage,
    disabled,
}) => {
    const dispatch = useAppDispatch()
    const addMetadata = useAddMetadata()
    const selected = useIsDimensionInLayout(dimension.id)
    const multiSelected = useAppSelector((state) =>
        isDimensionMultiSelected(state, dimension.id)
    )
    const activePopover = useAppSelector(getUiActiveDimensionPopover)
    const dimensionItemRef = useRef<HTMLDivElement>(null)
    const popoverIsOpen =
        activePopover?.source === 'sidebar' &&
        activePopover.dimensionId === dimension.id

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

    const handleClick = useCallback(
        (event: React.MouseEvent) => {
            event.stopPropagation()
            if (event.shiftKey && !selected) {
                populateMetadata()
                dispatch(toggleItemInMultiSelection(dimension.id))
                return
            }
            dispatch(clearMultiSelection())
            populateMetadata()
            dispatch(
                setUiActiveDimensionPopover({
                    dimensionId: dimension.id,
                    source: 'sidebar',
                })
            )
        },
        [dispatch, dimension.id, populateMetadata, selected]
    )

    const closeDimensionPopover = useCallback(() => {
        dispatch(setUiActiveDimensionPopover(null))
    }, [dispatch])

    const handleAddRemove = useCallback(() => {
        dispatch(clearMultiSelection())
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
        id: `sidebar-${dimension.id}`,
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
            activeReference={popoverIsOpen}
            multiSelected={multiSelected}
            disabled={disabled}
            isDragging={isDragging}
        >
            <div className={styles.content} ref={dimensionItemRef}>
                <DimensionItem
                    name={dimension.name}
                    dimensionType={dimension.dimensionType}
                    selected={selected}
                    disabled={disabled}
                    onClick={handleClick}
                />
                {!disabled && !multiSelected && (
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
                {popoverIsOpen && (
                    <Layer onBackdropClick={closeDimensionPopover}>
                        <Popper
                            reference={dimensionItemRef}
                            placement="right-start"
                        >
                            <DimensionPopoverCard
                                dimension={dimension}
                                onClose={closeDimensionPopover}
                                showArrow
                                source="sidebar"
                            />
                        </Popper>
                    </Layer>
                )}
            </div>
        </DimensionItemContainer>
    )
}
