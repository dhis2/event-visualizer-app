import { IconButton } from '@components/shared/icon-button'
import { useIsContainingCardDisabled } from '@components/sidebar/dimension-card'
import { useDimensionDisabledText } from '@components/sidebar/sidebar-disabling'
import { useIsDimensionInLayout } from '@components/sidebar/use-is-dimension-in-layout'
import { IconAdd16, IconSubtract16, Tooltip } from '@dhis2/ui'
import { useAddMetadata, useAppDispatch, useAppSelector } from '@hooks'
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
    disabled?: boolean
}

type TooltipRenderProps = {
    onBlur: React.FocusEventHandler<HTMLElement>
    onFocus: React.FocusEventHandler<HTMLElement>
    onMouseOver: React.MouseEventHandler<HTMLElement>
    onMouseOut: React.MouseEventHandler<HTMLElement>
    ref: React.MutableRefObject<HTMLElement>
}

type DraggableDimensionItemBodyProps = DraggableDimensionItemProps & {
    tooltipProps?: TooltipRenderProps
}

const DraggableDimensionItemBody: FC<DraggableDimensionItemBodyProps> = ({
    dimension,
    program,
    programStage,
    disabled = false,
    tooltipProps,
}) => {
    const dispatch = useAppDispatch()
    const addMetadata = useAddMetadata()
    const selected = useIsDimensionInLayout(dimension.id)
    const multiSelected = useAppSelector((state) =>
        isDimensionMultiSelected(state, dimension.id)
    )
    const isContainingCardDisabled = useIsContainingCardDisabled()
    const cardOrItemDisabled = isContainingCardDisabled || disabled

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
            disabled: cardOrItemDisabled || selected,
        })

    /* Tooltip's MutableRefObject<HTMLElement> targets a wider element
     * type than the container's HTMLDivElement ref slot. */
    const ref = tooltipProps
        ? (tooltipProps.ref as React.Ref<HTMLDivElement>)
        : setNodeRef

    return (
        <DimensionItemContainer
            ref={ref}
            style={style}
            {...attributes}
            {...listeners}
            onBlur={tooltipProps?.onBlur}
            onFocus={tooltipProps?.onFocus}
            onMouseOver={tooltipProps?.onMouseOver}
            onMouseOut={tooltipProps?.onMouseOut}
            aria-roledescription="draggable item"
            selected={selected}
            multiSelected={multiSelected}
            disabled={cardOrItemDisabled}
            isDragging={isDragging}
        >
            <div className={styles.content}>
                <DimensionItem
                    name={dimension.name}
                    dimensionType={dimension.dimensionType}
                    selected={selected}
                    disabled={cardOrItemDisabled}
                    onClick={handleClick}
                />
                {!cardOrItemDisabled && !multiSelected && (
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
    const layoutDisabledMessage = useDimensionDisabledText(props.dimension)
    if (layoutDisabledMessage) {
        return (
            <Tooltip
                content={layoutDisabledMessage}
                openDelay={1000}
                closeDelay={0}
            >
                {(tooltipProps: TooltipRenderProps) => (
                    <DraggableDimensionItemBody
                        {...props}
                        disabled
                        tooltipProps={tooltipProps}
                    />
                )}
            </Tooltip>
        )
    }
    return <DraggableDimensionItemBody {...props} />
}
