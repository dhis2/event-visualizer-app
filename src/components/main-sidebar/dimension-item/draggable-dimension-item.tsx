import type { SidebarSortableData } from '@components/app-wrapper/drag-and-drop-provider/types'
import { resolveId } from '@components/app-wrapper/metadata-provider/dimension'
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
    getUiActiveDimensionPopover,
    setUiActiveDimensionPopover,
} from '@store/ui-slice'
import {
    addVisUiConfigLayoutDimension,
    getVisUiConfigLayout,
    removeVisUiConfigLayoutDimension,
} from '@store/vis-ui-config-slice'
import type {
    Axis,
    DimensionMetadataItem,
    Layout,
    Program,
    ProgramStage,
} from '@types'
import { useCallback, useMemo, type FC } from 'react'
import { DimensionItem } from './dimension-item'
import { DimensionItemContainer } from './dimension-item-container'
import styles from './styles/draggable-dimension-item.module.css'

const LAYOUT_AXES: Axis[] = ['columns', 'filters', 'rows']

const getLayoutDimension = (
    layout: Layout,
    dimensionId: string
): { axisId: Axis; dimensionId: string } | undefined => {
    const resolvedDimensionId = resolveId(dimensionId)

    for (const axisId of LAYOUT_AXES) {
        const layoutDimensionId = layout[axisId].find(
            (id) => resolveId(id) === resolvedDimensionId
        )

        if (layoutDimensionId) {
            return { axisId, dimensionId: layoutDimensionId }
        }
    }
}

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
    const layout = useAppSelector(getVisUiConfigLayout)
    const layoutDimension = useMemo(
        () => getLayoutDimension(layout, dimension.id),
        [layout, dimension.id]
    )
    const selected = Boolean(layoutDimension)
    const multiSelected = useAppSelector((state) =>
        isDimensionMultiSelected(state, dimension.id)
    )
    const activePopover = useAppSelector(getUiActiveDimensionPopover)
    const popoverIsOpen =
        activePopover?.source === 'layout' &&
        resolveId(activePopover.dimensionId) === resolveId(dimension.id)

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
            const targetLayoutDimension = layoutDimension ?? {
                axisId: 'columns' as const,
                dimensionId: dimension.id,
            }

            if (!layoutDimension) {
                dispatch(
                    addVisUiConfigLayoutDimension({
                        axis: targetLayoutDimension.axisId,
                        dimensionId: targetLayoutDimension.dimensionId,
                    })
                )
            }

            dispatch(
                setUiActiveDimensionPopover({
                    dimensionId: targetLayoutDimension.dimensionId,
                    source: 'layout',
                    axisId: targetLayoutDimension.axisId,
                })
            )
        },
        [dispatch, dimension.id, layoutDimension, populateMetadata, selected]
    )

    const handleAddRemove = useCallback(() => {
        dispatch(clearMultiSelection())
        if (selected) {
            dispatch(
                removeVisUiConfigLayoutDimension({
                    dimensionId: layoutDimension?.dimensionId ?? dimension.id,
                })
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
    }, [dimension.id, layoutDimension, populateMetadata, dispatch, selected])

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
