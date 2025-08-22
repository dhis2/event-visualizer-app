import { IconAdd16, IconSubtract16 } from '@dhis2/ui'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React from 'react'
import { DimensionItemBase } from './dimension-item-base'
import { IconButton } from './icon-button'
import type { SupportedDimensionType } from '@constants/dimension-types'

interface DimensionItemProps {
    id: string
    draggableId?: string
    name: string
    dimensionType: SupportedDimensionType
    valueType?: string
    optionSet?: string | null
    stageName?: string
    disabled?: boolean
    selected?: boolean
}

export const DimensionItem: React.FC<DimensionItemProps> = ({
    id,
    draggableId,
    name,
    dimensionType,
    valueType,
    optionSet,
    stageName,
    disabled,
    selected,
}) => {
    // const dispatch = useDispatch()

    interface DimensionMetadata {
        id: string
        name: string
        dimensionType: SupportedDimensionType
        valueType?: string
        optionSet?: string | null
    }

    const dimensionMetadata: Record<string, DimensionMetadata> = {
        [id]: {
            id,
            name,
            dimensionType,
            valueType,
            optionSet,
        },
    }

    // const onClick = disabled
    //     ? undefined
    //     : () => dispatch(acSetUiOpenDimensionModal(id, dimensionMetadata))
    const onClick: () => void = () => {
        // TODO: Implement modal opening functionality
        console.log('Open dimension modal for:', id)
    }

    const {
        attributes: sortableAttributes,
        listeners: sortableListeners,
        isSorting,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id: draggableId || id,
        disabled: disabled || selected,
        data: dimensionMetadata[id],
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
        <div
            {...sortableAttributes}
            {...sortableListeners}
            ref={setNodeRef}
            style={style}
        >
            <DimensionItemBase
                name={name}
                dimensionType={dimensionType}
                disabled={disabled}
                selected={selected}
                stageName={stageName}
                onClick={onClick}
                menuButton={
                    !disabled && (
                        <IconButton
                            onClick={(
                                e: React.MouseEvent<HTMLButtonElement>
                            ) => {
                                e?.stopPropagation()

                                if (!selected) {
                                    // TODO: Implement add dimension functionality
                                    // dispatch(
                                    //     acAddUiLayoutDimensions(
                                    //         { [id]: { axisId: 'columns' } },
                                    //         dimensionMetadata
                                    //     )
                                    // )
                                    console.log(
                                        'Add dimension:',
                                        id,
                                        dimensionMetadata
                                    )
                                } else {
                                    // TODO: Implement remove dimension functionality
                                    // dispatch(acRemoveUiLayoutDimensions(id))
                                    console.log('Remove dimension:', id)
                                }
                            }}
                            dataTest={
                                selected
                                    ? `subtract-button-${id}`
                                    : `add-button-${id}`
                            }
                        >
                            {selected ? (
                                <IconSubtract16 />
                            ) : (
                                <IconAdd16 color="var(--colors-grey600)" />
                            )}
                        </IconButton>
                    )
                }
            />
        </div>
    )
}
