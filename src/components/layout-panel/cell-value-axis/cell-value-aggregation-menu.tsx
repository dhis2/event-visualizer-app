import {
    AGGREGATION_TYPES,
    aggregationTypeDisplayNames,
} from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import { FlyoutMenu, Layer, MenuItem, Popper } from '@dhis2/ui'
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
                {aggregationTypeDisplayNames[aggregationType]}
            </button>
            {isOpen && (
                <Layer
                    onBackdropClick={toggleIsOpen}
                    dataTest="cell-value-aggregation-backdrop"
                >
                    <Popper reference={buttonRef} placement="bottom-start">
                        <FlyoutMenu dense maxHeight="320px">
                            {SELECTABLE_AGGREGATION_TYPES.map((value) => (
                                <MenuItem
                                    key={value}
                                    label={
                                        value === itemDefault
                                            ? i18n.t(
                                                  'Use item default ({{- aggregationType}})',
                                                  {
                                                      aggregationType:
                                                          aggregationTypeDisplayNames[
                                                              value
                                                          ],
                                                      nsSeparator: '^^',
                                                  }
                                              )
                                            : aggregationTypeDisplayNames[value]
                                    }
                                    active={value === aggregationType}
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
