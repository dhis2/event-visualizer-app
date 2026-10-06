import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { getAvailableAxes } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { Button, FlyoutMenu, MenuItem, SplitButton, Tooltip } from '@dhis2/ui'
import {
    useAppDispatch,
    useAppSelector,
    useDimensionLayoutBlockedMessage,
    useDimensionMetadataItem,
    useSetCellValue,
} from '@hooks'
import { isValidCellValueDimension } from '@modules/dimension/cell-value'
import { getAxisName } from '@modules/layout.js'
import { getUiActiveDimensionModal } from '@store/ui-slice.js'
import {
    addVisUiConfigLayoutDimension,
    getVisUiConfigConditionsByDimension,
    getVisUiConfigVisualizationType,
    setVisUiConfigConditionsByDimension,
} from '@store/vis-ui-config-slice.js'
import type { Axis } from '@types'
import { useCallback, useMemo, type FC } from 'react'

type AddToLayoutButtonProps = {
    onClick: () => void
    dataTest?: string
}

export const AddToLayoutButton: FC<AddToLayoutButtonProps> = ({
    onClick,
    dataTest = 'add-to-layout-button',
}) => {
    const dispatch = useAppDispatch()

    const dimensionId = useAppSelector(
        getUiActiveDimensionModal
    ) as LayoutDimension['id']
    const visType = useAppSelector(getVisUiConfigVisualizationType)
    const dimension = useDimensionMetadataItem(dimensionId)
    const layoutBlockedMessage = useDimensionLayoutBlockedMessage(dimension)

    const availableAxes = useMemo(() => getAvailableAxes(visType), [visType])
    const setCellValue = useSetCellValue()
    const conditions = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimensionId)
    )

    /* A line list has no cell value axis to send it to. */
    const canBeCellValue =
        visType !== 'LINE_LIST' && isValidCellValueDimension(dimension)
    /* Grouping lives in the same entry but is seeded automatically, so only an
     * explicit filter counts as something the user would lose. */
    const hasFilters = Boolean(conditions.condition?.length)

    const onUseAsValueClick = useCallback(() => {
        if (!dimension) {
            return
        }
        /* A cell value is aggregated across the whole table, so the filters set
         * in this dialog have nothing to apply to. */
        if (hasFilters) {
            dispatch(
                setVisUiConfigConditionsByDimension({
                    dimensionId,
                    conditions: undefined,
                })
            )
        }
        setCellValue(dimension)
        onClick()
    }, [dimension, hasFilters, dispatch, dimensionId, setCellValue, onClick])

    const useAsValueLabel = hasFilters
        ? i18n.t('Use as value (without filters)')
        : i18n.t('Use as value')

    const onMenuItemClick = useCallback(
        (axisId: Axis): void => {
            dispatch(
                addVisUiConfigLayoutDimension({ axis: axisId, dimensionId })
            )

            onClick()
        },
        [dispatch, dimensionId, onClick]
    )

    const getButtonLabel = useCallback(
        (axisId: Axis): string =>
            i18n.t(`Add to {{- axisName}}`, {
                axisName: getAxisName(axisId),
            }),
        []
    )

    if (layoutBlockedMessage) {
        return (
            <Tooltip content={layoutBlockedMessage}>
                {({ onMouseOver, onMouseOut, onFocus, onBlur, ref }) => (
                    <span
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        ref={ref}
                    >
                        <Button disabled dataTest={dataTest}>
                            {getButtonLabel(availableAxes[0])}
                        </Button>
                    </span>
                )}
            </Tooltip>
        )
    }

    const secondaryAxes = availableAxes.slice(1)
    /* The primary action stays "add to the first axis"; everything else — the
     * remaining axes and the cell value — hangs off the split. A single axis
     * still needs the split once the cell value option applies. */
    const hasSecondaryOptions = secondaryAxes.length > 0 || canBeCellValue

    return hasSecondaryOptions ? (
        <SplitButton
            component={
                <FlyoutMenu
                    maxWidth="380px"
                    dataTest={`${dataTest}-flyout-menu`}
                >
                    {secondaryAxes.map((axisId) => (
                        <MenuItem
                            key={axisId}
                            dataTest={`${dataTest}-flyout-menu-option-${axisId}`}
                            onClick={() => onMenuItemClick(axisId)}
                            label={getButtonLabel(axisId)}
                        />
                    ))}
                    {canBeCellValue && (
                        <MenuItem
                            key="use-as-value"
                            dataTest={`${dataTest}-flyout-menu-option-use-as-value`}
                            onClick={onUseAsValueClick}
                            label={useAsValueLabel}
                        />
                    )}
                </FlyoutMenu>
            }
            onClick={() => onMenuItemClick(availableAxes[0])}
            dataTest={dataTest}
        >
            {getButtonLabel(availableAxes[0])}
        </SplitButton>
    ) : (
        <Button
            onClick={() => onMenuItemClick(availableAxes[0])}
            dataTest={dataTest}
        >
            {getButtonLabel(availableAxes[0])}
        </Button>
    )
}
