import { IconAdd16, IconSubtract16 } from '@dhis2/ui'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React from 'react'
import { DimensionItem } from './dimension-item'
import { IconButton } from './icon-button'
import type { SupportedDimensionType } from '@types'

interface DraggableDimensionItemProps {
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

export const DraggableDimensionItem: React.FC<DraggableDimensionItemProps> = ({
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

    const onClick: (() => void) | undefined = disabled
        ? undefined
        : () => {
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
            <DimensionItem
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
                                    console.log('Add dimension')
                                } else {
                                    // TODO: Implement remove dimension functionality
                                    console.log('Remove dimension')
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
