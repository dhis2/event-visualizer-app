import i18n from '@dhis2/d2-i18n'
import {
    Button,
    DropdownButton,
    FlyoutMenu,
    IconDimensionData16,
    MenuDivider,
    MenuItem,
    Tooltip,
} from '@dhis2/ui'
import { useAppDispatch } from '@hooks'
import {
    OPERATOR_IN,
    type QueryOperator,
    parseConditionsArrayToString,
    parseConditionsStringToArray,
} from '@modules/conditions'
import { setVisUiConfigConditionsByDimension } from '@store/vis-ui-config-slice'
import { useCallback, useMemo, useState, type FC } from 'react'
import { Conditions } from './conditions'
import { ConditionsSection } from './conditions-section'
import { useConditions } from './conditions-tab-content'
import {
    DataSectionToggle,
    type DataSectionToggleMode,
} from './data-section-toggle'
import classes from './styles/conditions-modal-content.module.css'

const computeInitialMode = (
    conditionString: string | undefined
): DataSectionToggleMode => {
    const parsed = parseConditionsStringToArray(conditionString ?? '')
    const hasPersisted = parsed.some(
        (condition) => condition.length && condition.slice(-1) !== ':'
    )
    return hasPersisted ? 'filter' : 'all'
}

export const DataSection: FC = () => {
    const dispatch = useAppDispatch()
    const {
        dimension,
        conditions,
        conditionsList,
        valueType,
        isOptionSetCondition,
        isSupported,
        dropdownOperators,
        canHaveLegendSets,
        addCondition,
    } = useConditions()

    const isOrgUnitValueType = valueType === 'ORGANISATION_UNIT'
    const isSingleCondition: boolean = Boolean(
        isOptionSetCondition ||
        (valueType &&
            (valueType === 'BOOLEAN' ||
                valueType === 'TRUE_ONLY' ||
                valueType === 'ORGANISATION_UNIT'))
    )

    const [mode, setModeState] = useState<DataSectionToggleMode>(() =>
        computeInitialMode(conditions.condition)
    )
    const [draftConditions, setDraftConditions] = useState<string[]>([])

    const setMode = useCallback(
        (next: DataSectionToggleMode) => {
            if (next === mode) {
                return
            }
            setModeState(next)
            if (next === 'all') {
                const snapshot = parseConditionsStringToArray(
                    conditions.condition ?? ''
                )
                setDraftConditions(snapshot)
                dispatch(
                    setVisUiConfigConditionsByDimension({
                        dimensionId: dimension.id,
                        conditions: '',
                        legendSet: conditions.legendSet,
                    })
                )
                return
            }
            const reduxHasConditions = Boolean(
                conditions.condition && conditions.condition.length > 0
            )
            if (reduxHasConditions) {
                return
            }
            if (draftConditions.length > 0) {
                dispatch(
                    setVisUiConfigConditionsByDimension({
                        dimensionId: dimension.id,
                        conditions:
                            parseConditionsArrayToString(draftConditions),
                        legendSet: conditions.legendSet,
                    })
                )
                setDraftConditions([])
            }
        },
        [
            mode,
            conditions.condition,
            conditions.legendSet,
            dimension.id,
            draftConditions,
            dispatch,
        ]
    )

    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const toggleDropdown = useCallback(
        () => setIsDropdownOpen((open) => !open),
        []
    )

    const disableAddButton: boolean =
        canHaveLegendSets &&
        conditionsList.some((condition) => condition.includes(OPERATOR_IN))

    const addButtonLabel = useMemo(
        () =>
            conditionsList.length
                ? i18n.t('Add another filter')
                : i18n.t('Add a filter'),
        [conditionsList.length]
    )

    const addLegendFilter = useCallback(() => {
        setIsDropdownOpen(false)
        addCondition(OPERATOR_IN)
    }, [addCondition])

    const handleAddOperator = useCallback(
        (key: QueryOperator) => {
            setIsDropdownOpen(false)
            addCondition(key)
        },
        [addCondition]
    )

    if (isOrgUnitValueType) {
        return (
            <ConditionsSection
                title={i18n.t('Data')}
                titleIcon={<IconDimensionData16 />}
                dataTest="dimension-popover-data-section"
            >
                <div className={classes.mainSection}>
                    <Conditions />
                </div>
            </ConditionsSection>
        )
    }

    if (!isSupported) {
        return (
            <ConditionsSection
                title={i18n.t('Data')}
                titleIcon={<IconDimensionData16 />}
                dataTest="dimension-popover-data-section"
            >
                <p className={classes.paragraph}>
                    {i18n.t(
                        "This dimension can't be filtered. All values will be shown."
                    )}
                </p>
            </ConditionsSection>
        )
    }

    const showAddButton =
        mode === 'filter' && !isSingleCondition && conditionsList.length > 0

    return (
        <ConditionsSection
            title={i18n.t('Data')}
            titleIcon={<IconDimensionData16 />}
            dataTest="dimension-popover-data-section"
        >
            <div className={classes.dataSectionStack}>
                <DataSectionToggle
                    mode={mode}
                    onChange={setMode}
                    dataTest="dimension-popover-data-toggle"
                />
                {mode === 'filter' && (
                    <div className={classes.mainSection}>
                        <Conditions />
                        {showAddButton && (
                            <Tooltip
                                content={i18n.t(
                                    "Preset options can't be combined with other filters"
                                )}
                                placement="bottom"
                                closeDelay={200}
                            >
                                {({ onMouseOver, onMouseOut, ref }) => (
                                    <span
                                        ref={ref}
                                        onMouseOver={(event) =>
                                            disableAddButton &&
                                            onMouseOver(event)
                                        }
                                        onMouseOut={(event) =>
                                            disableAddButton &&
                                            onMouseOut(event)
                                        }
                                        className={classes.tooltipReference}
                                    >
                                        {conditions.legendSet ? (
                                            <Button
                                                type="button"
                                                small
                                                secondary
                                                onClick={addLegendFilter}
                                                className={
                                                    classes.addConditionButton
                                                }
                                                disabled={disableAddButton}
                                                dataTest="button-add-condition"
                                            >
                                                {addButtonLabel}
                                            </Button>
                                        ) : (
                                            <DropdownButton
                                                type="button"
                                                small
                                                secondary
                                                open={isDropdownOpen}
                                                onClick={toggleDropdown}
                                                className={
                                                    classes.addConditionButton
                                                }
                                                disabled={disableAddButton}
                                                dataTest="button-add-condition"
                                                component={
                                                    <FlyoutMenu
                                                        dense
                                                        dataTest="add-condition-menu"
                                                    >
                                                        {Object.entries(
                                                            dropdownOperators
                                                        ).map(
                                                            ([key, label]) => (
                                                                <MenuItem
                                                                    key={key}
                                                                    label={
                                                                        label
                                                                    }
                                                                    onClick={() =>
                                                                        handleAddOperator(
                                                                            key as QueryOperator
                                                                        )
                                                                    }
                                                                    dataTest={`add-condition-menu-item-${key}`}
                                                                />
                                                            )
                                                        )}
                                                        {canHaveLegendSets && (
                                                            <>
                                                                <MenuDivider
                                                                    dense
                                                                />
                                                                {/* Stricter than disableAddButton: once any condition exists, the IN operator is not offered at all, since it is mutually exclusive with every other operator. */}
                                                                <MenuItem
                                                                    dense
                                                                    label={i18n.t(
                                                                        'is one of preset options'
                                                                    )}
                                                                    disabled={
                                                                        conditionsList.length >
                                                                        0
                                                                    }
                                                                    onClick={() =>
                                                                        handleAddOperator(
                                                                            OPERATOR_IN
                                                                        )
                                                                    }
                                                                    dataTest={`add-condition-menu-item-${OPERATOR_IN}`}
                                                                />
                                                            </>
                                                        )}
                                                    </FlyoutMenu>
                                                }
                                            >
                                                {addButtonLabel}
                                            </DropdownButton>
                                        )}
                                    </span>
                                )}
                            </Tooltip>
                        )}
                    </div>
                )}
            </div>
        </ConditionsSection>
    )
}
