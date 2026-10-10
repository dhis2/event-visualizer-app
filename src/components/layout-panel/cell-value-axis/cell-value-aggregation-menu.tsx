import {
    AGGREGATION_TYPES,
    aggregationTypeDisplayNames,
} from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import { FlyoutMenu, Layer, MenuItem, Popper } from '@dhis2/ui'
import { resolveAggregationType } from '@modules/dimension/aggregation-type'
import type { AggregationType } from '@types'
import { useCallback, useEffect, useRef, useState, type FC } from 'react'
import classes from './styles/cell-value-aggregation-menu.module.css'

/* `DEFAULT` is resolved to a concrete type before a cell value is stored, so it
 * is never a choice here — which is what lets the axis show a real aggregation
 * name rather than the word "default". */
const SELECTABLE_AGGREGATION_TYPES = AGGREGATION_TYPES.filter(
    (aggregationType) => aggregationType !== 'DEFAULT'
)

type CellValueAggregationMenuProps = {
    aggregationType: AggregationType
    /* The data item's own aggregation type, so the entry matching it can say so.
     * `NONE` cannot be aggregated, so it is not a usable default. */
    itemAggregationType?: AggregationType
    onChange: (aggregationType: AggregationType) => void
}

export const CellValueAggregationMenu: FC<CellValueAggregationMenuProps> = ({
    aggregationType,
    itemAggregationType,
    onChange,
}) => {
    const itemDefault =
        itemAggregationType && itemAggregationType !== 'NONE'
            ? itemAggregationType
            : undefined
    /* The trigger always names a real aggregation, never the word "default". */
    const resolvedAggregationType = resolveAggregationType(aggregationType, {
        aggregationType: itemAggregationType,
    })
    /* `DEFAULT` matches no entry in the list below, leaving the shortcut as the
     * only marked row. Without a usable item default there is no shortcut, so
     * the mark falls to the resolved type instead. */
    const activeAggregationType = itemDefault
        ? aggregationType
        : resolvedAggregationType
    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const toggleIsOpen = useCallback(() => setIsOpen((curr) => !curr), [])

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen])

    return (
        <>
            <button
                type="button"
                ref={buttonRef}
                className={classes.trigger}
                onClick={toggleIsOpen}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                data-test="cell-value-aggregation-trigger"
            >
                {aggregationTypeDisplayNames[resolvedAggregationType]}
            </button>
            {isOpen && (
                <Layer
                    onBackdropClick={toggleIsOpen}
                    dataTest="cell-value-aggregation-backdrop"
                >
                    <Popper reference={buttonRef} placement="bottom-start">
                        <FlyoutMenu dense maxHeight="320px">
                            {/* Stores `DEFAULT`, so picking the item's own
                                type from the list below stays distinguishable
                                from leaving it untouched. */}
                            {itemDefault && (
                                <MenuItem
                                    label={i18n.t(
                                        'Use item default ({{- aggregationType}})',
                                        {
                                            aggregationType:
                                                aggregationTypeDisplayNames[
                                                    itemDefault
                                                ],
                                            nsSeparator: '^^',
                                        }
                                    )}
                                    active={aggregationType === 'DEFAULT'}
                                    onClick={() => {
                                        onChange('DEFAULT')
                                        toggleIsOpen()
                                    }}
                                    dataTest="cell-value-aggregation-item-default"
                                />
                            )}
                            {SELECTABLE_AGGREGATION_TYPES.map((value) => (
                                <MenuItem
                                    key={value}
                                    label={aggregationTypeDisplayNames[value]}
                                    active={value === activeAggregationType}
                                    onClick={() => {
                                        onChange(value)
                                        toggleIsOpen()
                                    }}
                                    dataTest={`cell-value-aggregation-item-${value}`}
                                />
                            ))}
                        </FlyoutMenu>
                    </Popper>
                </Layer>
            )}
        </>
    )
}
