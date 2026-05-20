import type { SidebarSortableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import { useDimensionDialogAnchor } from '@components/dimension-dialog/anchor-context'
import { useIsDimensionInLayout } from '@components/main-sidebar/use-is-dimension-in-layout'
import { IconButton } from '@components/shared/icon-button'
import { IconAdd16, IconSubtract16 } from '@dhis2/ui'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAddMetadata, useAppDispatch, useAppSelector } from '@hooks'
import {
    clearMultiSelection,
    isDimensionMultiSelected,
    toggleItemInMultiSelection,
} from '@store/dimensions-selection-slice'
import {
    getUiActiveDimensionModal,
    setUiActiveDimensionModal,
    setUiDimensionDialogOriginType,
} from '@store/ui-slice'
import {
    addVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimension,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem, Program, ProgramStage } from '@types'
import { useCallback, useEffect, useRef, type FC } from 'react'
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
    const activeDimensionModal = useAppSelector(getUiActiveDimensionModal)
    const isDialogOpen = activeDimensionModal === dimension.id
    const { setAnchorEl } = useDimensionDialogAnchor()
    const itemRootRef = useRef<HTMLDivElement | null>(null)

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
            } else if (activeDimensionModal === dimension.id) {
                dispatch(setUiActiveDimensionModal(null))
                setAnchorEl(null)
            } else {
                dispatch(clearMultiSelection())
                populateMetadata()
                setAnchorEl(itemRootRef.current)
                dispatch(setUiDimensionDialogOriginType('sidebar'))
                dispatch(setUiActiveDimensionModal(dimension.id))
            }
        },
        [
            activeDimensionModal,
            dispatch,
            dimension.id,
            populateMetadata,
            selected,
            setAnchorEl,
        ]
    )

    const isDialogOpenRef = useRef(isDialogOpen)
    isDialogOpenRef.current = isDialogOpen
    useEffect(() => {
        return () => {
            if (isDialogOpenRef.current) {
                dispatch(setUiActiveDimensionModal(null))
                setAnchorEl(null)
            }
        }
    }, [dispatch, setAnchorEl])

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

    const setRefs = useCallback(
        (node: HTMLDivElement | null) => {
            itemRootRef.current = node
            setNodeRef(node)
        },
        [setNodeRef]
    )

    return (
        <DimensionItemContainer
            ref={setRefs}
            style={style}
            {...attributes}
            {...listeners}
            aria-roledescription="draggable item"
            selected={selected}
            multiSelected={multiSelected}
            disabled={disabled}
            isDragging={isDragging}
            dialogOpen={isDialogOpen}
        >
            <div className={styles.content}>
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
            </div>
        </DimensionItemContainer>
    )
}
