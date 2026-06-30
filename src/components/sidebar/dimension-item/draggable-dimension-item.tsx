import { IconButton } from '@components/shared/icon-button'
import { useIsDimensionInLayout } from '@components/sidebar/use-is-dimension-in-layout'
import { IconAdd16, IconSubtract16 } from '@dhis2/ui'
import {
    useAddMetadata,
    useAppDispatch,
    useAppSelector,
    useDimensionLayoutBlockedMessage,
} from '@hooks'
import {
    clearMultiSelection,
    isDimensionMultiSelected,
    toggleItemInMultiSelection,
} from '@store/dimensions-selection-slice'
import { setUiActiveDimensionModal } from '@store/ui-slice'
import {
    addVisUiConfigLayoutDimension,
    removeVisUiConfigLayoutDimension,
} from '@store/vis-ui-config-slice'
import type { Axis, DimensionMetadataItem, Program, ProgramStage } from '@types'
import { useCallback, type FC } from 'react'
import { DimensionItem } from './dimension-item'
import { DimensionItemContainer } from './dimension-item-container'
import styles from './styles/draggable-dimension-item.module.css'
import { useDimensionItemDnd } from './use-dimension-item-dnd'

interface DraggableDimensionItemProps {
    dimension: DimensionMetadataItem
    program?: Program
    programStage?: ProgramStage
}

type DraggableDimensionItemBodyProps = DraggableDimensionItemProps & {
    layoutBlockedMessage: string | null
}

const DraggableDimensionItemBody: FC<DraggableDimensionItemBodyProps> = ({
    dimension,
    program,
    programStage,
    layoutBlockedMessage,
}) => {
    const dispatch = useAppDispatch()
    const addMetadata = useAddMetadata()
    const selected = useIsDimensionInLayout(dimension.id)
    const multiSelected = useAppSelector((state) =>
        isDimensionMultiSelected(state, dimension.id)
    )

    const populateMetadata = useCallback(() => {
        // Adding the program also stores its stages and TET.
        if (program) {
            addMetadata(program)
        } else if (programStage) {
            addMetadata(programStage)
        }
        addMetadata(dimension)
    }, [addMetadata, dimension, program, programStage])

    const handleClick = useCallback(
        (event: React.MouseEvent) => {
            event.stopPropagation()
            if (event.shiftKey && !selected) {
                populateMetadata()
                dispatch(toggleItemInMultiSelection(dimension.id))
            } else {
                dispatch(clearMultiSelection())
                populateMetadata()
                dispatch(setUiActiveDimensionModal(dimension.id))
            }
        },
        [dispatch, dimension.id, populateMetadata, selected]
    )

    const handleAddRemove = useCallback(() => {
        dispatch(clearMultiSelection())
        if (selected) {
            dispatch(
                removeVisUiConfigLayoutDimension({ dimensionId: dimension.id })
            )
        } else {
            populateMetadata()
            const defaultAxis: Axis = 'columns'
            dispatch(
                addVisUiConfigLayoutDimension({
                    axis: defaultAxis,
                    dimensionId: dimension.id,
                })
            )
        }
    }, [dimension.id, populateMetadata, dispatch, selected])

    const { setNodeRef, attributes, listeners, isDragging, style } =
        useDimensionItemDnd({
            dimension,
            populateMetadata,
            disabled: selected,
            layoutBlockedMessage,
        })

    return (
        <DimensionItemContainer
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            aria-roledescription="draggable item"
            selected={selected}
            multiSelected={multiSelected}
            isDragging={isDragging}
        >
            <div className={styles.content}>
                <DimensionItem
                    name={dimension.name}
                    dimensionType={dimension.dimensionType}
                    selected={selected}
                    onClick={handleClick}
                />
                {!multiSelected && !layoutBlockedMessage && (
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

export const DraggableDimensionItem: FC<DraggableDimensionItemProps> = (
    props
) => {
    const layoutBlockedMessage = useDimensionLayoutBlockedMessage(
        props.dimension
    )
    return (
        <DraggableDimensionItemBody
            {...props}
            layoutBlockedMessage={layoutBlockedMessage}
        />
    )
}
