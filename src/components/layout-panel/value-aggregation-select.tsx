import {
    AGGREGATION_TYPES,
    aggregationTypeDisplayNames,
} from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import { FlyoutMenu, Layer, MenuItem, Popper } from '@dhis2/ui'
import { useAppDispatch } from '@hooks'
import {
    setVisUiConfigCustomValue,
    type CustomValueObject,
} from '@store/vis-ui-config-slice'
import type { AggregationType } from '@types'
import { useCallback, useRef, useState, type FC } from 'react'
import classes from './styles/value-axis.module.css'
import { useItemAggregationType } from './use-item-aggregation-type'

/* A custom aggregation needs an expression, which the value axis has no way
 * to enter. */
const SELECTABLE_AGGREGATION_TYPES = AGGREGATION_TYPES.filter(
    (aggregationType) => aggregationType !== 'CUSTOM'
)

/* Keeps the long list of aggregation types short enough to open below the
 * button, instead of being shifted up over it to fit the viewport. */
const MENU_MAX_HEIGHT = '320px'

type ValueAggregationSelectProps = {
    customValue: CustomValueObject
}

export const ValueAggregationSelect: FC<ValueAggregationSelectProps> = ({
    customValue,
}) => {
    const dispatch = useAppDispatch()
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const { aggregationType: itemAggregationType, isLoading } =
        useItemAggregationType(customValue.id)
    const isDefault = customValue.aggregationType === 'DEFAULT'

    const toggleMenu = useCallback(
        () => setIsMenuOpen((currentIsMenuOpen) => !currentIsMenuOpen),
        []
    )

    const onSelect = useCallback(
        (aggregationType: AggregationType) => {
            dispatch(
                setVisUiConfigCustomValue({
                    id: customValue.id,
                    aggregationType,
                })
            )
            setIsMenuOpen(false)
        },
        [dispatch, customValue.id]
    )

    const effectiveAggregationType = isDefault
        ? itemAggregationType
        : customValue.aggregationType

    const getOptionLabel = (aggregationType: AggregationType): string =>
        aggregationType === 'DEFAULT' && itemAggregationType
            ? i18n.t('Use item default ({{- aggregationTypeName}})', {
                  aggregationTypeName:
                      aggregationTypeDisplayNames[itemAggregationType],
              })
            : aggregationTypeDisplayNames[aggregationType]

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                className={classes.aggregationButton}
                onClick={toggleMenu}
                aria-label={i18n.t('Change aggregation type')}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-busy={isDefault && isLoading}
                data-test="value-aggregation-button"
            >
                {isDefault && isLoading ? (
                    <span
                        className={classes.aggregationLoading}
                        data-test="value-aggregation-loading"
                    />
                ) : effectiveAggregationType ? (
                    aggregationTypeDisplayNames[effectiveAggregationType]
                ) : (
                    i18n.t('Default')
                )}
            </button>
            {isMenuOpen && (
                <Layer onBackdropClick={toggleMenu}>
                    <Popper reference={buttonRef} placement="bottom-start">
                        <FlyoutMenu
                            dense
                            maxHeight={MENU_MAX_HEIGHT}
                            dataTest="value-aggregation-menu"
                        >
                            {SELECTABLE_AGGREGATION_TYPES.map(
                                (aggregationType) => (
                                    <MenuItem
                                        key={aggregationType}
                                        label={getOptionLabel(aggregationType)}
                                        active={
                                            aggregationType ===
                                            customValue.aggregationType
                                        }
                                        onClick={() =>
                                            onSelect(aggregationType)
                                        }
                                        dataTest={`value-aggregation-option-${aggregationType}`}
                                    />
                                )
                            )}
                        </FlyoutMenu>
                    </Popper>
                </Layer>
            )}
        </>
    )
}
