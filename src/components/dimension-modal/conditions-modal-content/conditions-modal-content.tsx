import i18n from '@dhis2/d2-i18n'
import { Button, IconInfo16, Tooltip, TabBar, Tab } from '@dhis2/ui'
import { type FC, type ReactNode, /*useMemo,*/ useState } from 'react'
import {
    PhoneNumberCondition,
    CaseSensitiveAlphanumericCondition,
    LetterCondition,
} from './alphanumeric-condition'
import { BooleanCondition, TrueOnlyCondition } from './boolean-condition'
import {
    DateCondition,
    DateTimeCondition,
    TimeCondition,
} from './date-condition'
//import NumericCondition from './NumericCondition.jsx'
import { OptionSetCondition } from './option-set-condition/option-set-condition'
import { OrgUnitCondition } from './org-unit-condition'
import { RepeatableEvents } from './repeatable-events'
import classes from './styles/conditions-modal-content.module.css'
import {
    useAppDispatch,
    useAppSelector,
    useProgramStageMetadataItem,
} from '@hooks'
import {
    OPERATOR_IN,
    PREFIX_CASE_INSENSITIVE,
    parseConditionsArrayToString,
    parseConditionsStringToArray,
} from '@modules/conditions'
import { getDimensionIdParts } from '@modules/dimension.js'
import { isValueTypeNumeric } from '@modules/value-type'
import {
    getVisUiConfigConditionsByDimension,
    setVisUiConfigConditionsByDimension,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice.js'
import type { DimensionMetadataItem, ValueType } from '@types'

const TAB_CONDITIONS = 'CONDITIONS'
const TAB_REPEATABLE_EVENTS = 'REPEATABLE_EVENTS'

const SINGLETON_TYPES: ValueType[] = [
    'BOOLEAN',
    'TRUE_ONLY',
    'ORGANISATION_UNIT',
]

// List of supported types for conditions
const SUPPORTED_TYPES: ValueType[] = [
    'NUMBER',
    'UNIT_INTERVAL',
    'PERCENTAGE',
    'INTEGER',
    'INTEGER_POSITIVE',
    'INTEGER_NEGATIVE',
    'INTEGER_ZERO_OR_POSITIVE',
    'TEXT',
    'LONG_TEXT',
    'LETTER',
    'PHONE_NUMBER',
    'EMAIL',
    'USERNAME',
    'URL',
    'BOOLEAN',
    'TRUE_ONLY',
    'DATE',
    'TIME',
    'DATETIME',
    'ORGANISATION_UNIT',
]

const EMPTY_CONDITION = ''

type ConditionsModalContentProps = {
    dimension: DimensionMetadataItem
}

export const ConditionsModalContent: FC<ConditionsModalContentProps> = ({
    dimension,
}) => {
    console.log('dimension', dimension)

    const dispatch = useAppDispatch()

    const visType = useAppSelector(getVisUiConfigVisualizationType)

    const conditions = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimension?.id)
    )

    console.log('conditions', conditions)

    const stage = useProgramStageMetadataItem(
        getDimensionIdParts({ id: dimension.id }).programStageId
    )

    console.log('stage', stage)

    const valueType = dimension.valueType!
    const isProgramIndicator: boolean =
        dimension.dimensionType === 'PROGRAM_INDICATOR'
    const isOptionSetCondition: boolean = Boolean(dimension.optionSet)
    const canHaveLegendSets: boolean =
        isValueTypeNumeric(valueType) || isProgramIndicator
    const isSupported: boolean =
        SUPPORTED_TYPES.includes(valueType) || isProgramIndicator

    const getInitConditions = (): string[] | null =>
        conditions.condition?.length
            ? parseConditionsStringToArray(conditions.condition)
            : null

    const getEmptyConditions = (): string[] =>
        SINGLETON_TYPES.includes(valueType) ||
        isOptionSetCondition ||
        conditions.legendSet
            ? [EMPTY_CONDITION]
            : []

    const [conditionsList, setConditionsList] = useState<string[]>(
        getInitConditions() || getEmptyConditions()
    )
    const [currentTab, setCurrentTab] = useState<string>(TAB_CONDITIONS)
    const [selectedLegendSet, setSelectedLegendSet] = useState<
        string | undefined
    >(conditions.legendSet)

    const addCondition = (): void => {
        setConditionsList((prev) => [...prev, EMPTY_CONDITION])
    }

    const removeCondition = (conditionIndex: number): void =>
        setConditionsList((prev) => {
            const updatedConditionsList = prev.filter(
                (_, index) => index !== conditionIndex
            )

            storeConditions(updatedConditionsList)

            if (
                selectedLegendSet &&
                !updatedConditionsList.some((condition) =>
                    condition.includes(OPERATOR_IN)
                )
            ) {
                setSelectedLegendSet(undefined)
            }

            return updatedConditionsList
        })

    const setCondition = (conditionIndex: number, value: string): void =>
        setConditionsList((prev) => {
            const updatedConditionsList = prev.map((condition, index) =>
                index === conditionIndex ? value : condition
            )
            console.log('updatedConditionsList', updatedConditionsList)
            storeConditions(updatedConditionsList)

            return updatedConditionsList
        })

    const storeConditions = (conditionsList: string[]) =>
        dispatch(
            setVisUiConfigConditionsByDimension({
                dimensionId: dimension.id,
                conditions: parseConditionsArrayToString(
                    conditionsList.filter(
                        (condition) =>
                            condition.length && condition.slice(-1) !== ':'
                    )
                ),
                legendSet: selectedLegendSet,
            })
        )

    const renderConditionsContent = (): ReactNode => {
        const getDividerContent = (index: number): ReactNode =>
            conditionsList.length > 1 &&
            index < conditionsList.length - 1 && (
                <span className={classes.separator}>{i18n.t('and')}</span>
            )
        console.log('conditions list', conditionsList)

        if (isOptionSetCondition) {
            return conditionsList.map((condition, index) => (
                <div key={index}>
                    <OptionSetCondition
                        condition={condition}
                        optionSetId={dimension.optionSet!}
                        onChange={(value) => setCondition(index, value)}
                    />
                </div>
            ))
        }
        //
        //        const renderNumericCondition = ({
        //            enableDecimalSteps,
        //            allowIntegerOnly,
        //        } = {}) => {
        //            return (
        //                (conditionsList.length && conditionsList) ||
        //                (selectedLegendSet && [''])
        //            ).map((condition, index) => (
        //                <div key={index}>
        //                    <NumericCondition
        //                        condition={condition}
        //                        onChange={(value) => setCondition(index, value)}
        //                        onRemove={() => removeCondition(index)}
        //                        numberOfConditions={
        //                            conditionsList.length || (selectedLegendSet ? 1 : 0)
        //                        }
        //                        legendSetId={selectedLegendSet}
        //                        onLegendSetChange={(value) =>
        //                            setSelectedLegendSet(value)
        //                        }
        //                        enableDecimalSteps={enableDecimalSteps}
        //                        allowIntegerOnly={allowIntegerOnly}
        //                        dimension={dimension}
        //                    />
        //                    {getDividerContent(index)}
        //                </div>
        //            ))
        //        }
        //
        //        if (isProgramIndicator) {
        //            return renderNumericCondition()
        //        }
        //
        switch (valueType) {
            //            case VALUE_TYPE_UNIT_INTERVAL: {
            //                return renderNumericCondition({ enableDecimalSteps: true })
            //            }
            //            case VALUE_TYPE_INTEGER:
            //            case VALUE_TYPE_INTEGER_POSITIVE:
            //            case VALUE_TYPE_INTEGER_NEGATIVE:
            //            case VALUE_TYPE_INTEGER_ZERO_OR_POSITIVE: {
            //                return renderNumericCondition({ allowIntegerOnly: true })
            //            }
            //            case VALUE_TYPE_NUMBER:
            //            case VALUE_TYPE_PERCENTAGE: {
            //                return renderNumericCondition()
            //            }
            case 'PHONE_NUMBER': {
                return conditionsList.map((condition, index) => (
                    <div key={index}>
                        <PhoneNumberCondition
                            condition={condition}
                            onChange={(value) => setCondition(index, value)}
                            onRemove={() => removeCondition(index)}
                        />
                        {getDividerContent(index)}
                    </div>
                ))
            }
            case 'LETTER': {
                return conditionsList.map((condition, index) => (
                    <div key={index}>
                        <LetterCondition
                            condition={condition}
                            onChange={(value) => setCondition(index, value)}
                            onRemove={() => removeCondition(index)}
                        />
                        {getDividerContent(index)}
                    </div>
                ))
            }
            case 'TEXT':
            case 'LONG_TEXT':
            case 'EMAIL':
            case 'USERNAME':
            case 'URL': {
                return conditionsList.map((condition, index) => (
                    <div key={index}>
                        <CaseSensitiveAlphanumericCondition
                            condition={
                                condition || `${PREFIX_CASE_INSENSITIVE}:`
                            }
                            onChange={(value) => setCondition(index, value)}
                            onRemove={() => removeCondition(index)}
                        />
                        {getDividerContent(index)}
                    </div>
                ))
            }
            case 'BOOLEAN': {
                return conditionsList.map((condition, index) => (
                    <div key={index}>
                        <BooleanCondition
                            condition={condition}
                            onChange={(value) => setCondition(index, value)}
                        />
                    </div>
                ))
            }
            case 'TRUE_ONLY': {
                return conditionsList.map((condition, index) => (
                    <div key={index}>
                        <TrueOnlyCondition
                            condition={condition}
                            onChange={(value) => setCondition(index, value)}
                        />
                    </div>
                ))
            }
            case 'DATE': {
                return conditionsList.map((condition, index) => (
                    <div key={index}>
                        <DateCondition
                            condition={condition}
                            onChange={(value) => setCondition(index, value)}
                            onRemove={() => removeCondition(index)}
                        />
                        {getDividerContent(index)}
                    </div>
                ))
            }
            case 'TIME': {
                return conditionsList.map((condition, index) => (
                    <div key={index}>
                        <TimeCondition
                            condition={condition}
                            onChange={(value) => setCondition(index, value)}
                            onRemove={() => removeCondition(index)}
                        />
                        {getDividerContent(index)}
                    </div>
                ))
            }
            case 'DATETIME': {
                return conditionsList.map((condition, index) => (
                    <div key={index}>
                        <DateTimeCondition
                            condition={condition}
                            onChange={(value) => setCondition(index, value)}
                            onRemove={() => removeCondition(index)}
                        />
                        {getDividerContent(index)}
                    </div>
                ))
            }
            case 'ORGANISATION_UNIT': {
                return conditionsList.map((condition, index) => (
                    <div key={index}>
                        <OrgUnitCondition
                            condition={condition}
                            onChange={(value) => setCondition(index, value)}
                        />
                    </div>
                ))
            }
        }
    }

    const disableAddButton: boolean =
        canHaveLegendSets &&
        (conditionsList.some((condition) => condition.includes(OPERATOR_IN)) ||
            Boolean(selectedLegendSet))

    const isRepeatable: boolean =
        visType === 'LINE_LIST' &&
        dimension.dimensionType === 'DATA_ELEMENT' &&
        Boolean(stage?.repeatable)

    const renderConditions = (): ReactNode => (
        <>
            <div>
                {isSupported ? (
                    <p className={classes.paragraph}>
                        {i18n.t(
                            'Show items that meet the following conditions for this data item:',
                            { nsSeparator: '^^' }
                        )}
                    </p>
                ) : (
                    <p className={classes.paragraph}>
                        {i18n.t(
                            "This dimension can't be filtered. All values will be shown."
                        )}
                    </p>
                )}
            </div>
            {isSupported && (
                <div className={classes.mainSection}>
                    {!conditionsList.length &&
                    !selectedLegendSet &&
                    !(
                        SINGLETON_TYPES.includes(valueType) ||
                        isOptionSetCondition
                    ) ? (
                        <p className={classes.paragraph}>
                            <span className={classes.infoIcon}>
                                <IconInfo16 />
                            </span>
                            {i18n.t(
                                'No conditions yet, so all values will be included. Add a condition to filter results.'
                            )}
                        </p>
                    ) : (
                        renderConditionsContent()
                    )}
                    {!(
                        SINGLETON_TYPES.includes(valueType) ||
                        isOptionSetCondition
                    ) && (
                        <Tooltip
                            content={i18n.t(
                                "Preset options can't be combined with other conditions"
                            )}
                            placement="bottom"
                            closeDelay={200}
                        >
                            {({ onMouseOver, onMouseOut, ref }) => (
                                <span
                                    ref={ref}
                                    onMouseOver={(event) =>
                                        disableAddButton && onMouseOver(event)
                                    }
                                    onMouseOut={(event) =>
                                        disableAddButton && onMouseOut(event)
                                    }
                                    className={classes.tooltipReference}
                                >
                                    <Button
                                        type="button"
                                        small
                                        onClick={addCondition}
                                        className={classes.addConditionButton}
                                        disabled={disableAddButton}
                                        dataTest="button-add-condition"
                                    >
                                        {conditionsList.length
                                            ? i18n.t('Add another condition')
                                            : i18n.t('Add a condition')}
                                    </Button>
                                </span>
                            )}
                        </Tooltip>
                    )}
                </div>
            )}
        </>
    )

    const renderTabs = (): ReactNode => {
        // XXX: this is not possible anymore since we look at stage.repeatable for isRepeatable
        const disableRepeatableTab = !stage?.repeatable
        const repeatableTab = (
            <Tab
                key={TAB_REPEATABLE_EVENTS}
                onClick={() => setCurrentTab(TAB_REPEATABLE_EVENTS)}
                selected={currentTab === TAB_REPEATABLE_EVENTS}
                disabled={disableRepeatableTab}
            >
                {i18n.t('Repeated events')}
            </Tab>
        )

        return (
            <>
                <TabBar className={classes.tabBar}>
                    <Tab
                        key={TAB_CONDITIONS}
                        onClick={() => setCurrentTab(TAB_CONDITIONS)}
                        selected={currentTab === TAB_CONDITIONS}
                    >
                        {i18n.t('Conditions')}
                    </Tab>
                    {disableRepeatableTab ? (
                        <Tooltip
                            key="repeatable-tooltip"
                            placement="bottom"
                            content={i18n.t(
                                'Only available for repeatable stages'
                            )}
                            dataTest="repeatable-events-tooltip"
                        >
                            {repeatableTab}
                        </Tooltip>
                    ) : (
                        repeatableTab
                    )}
                </TabBar>
                {currentTab === TAB_CONDITIONS ? (
                    renderConditions()
                ) : (
                    <RepeatableEvents dimensionId={dimension.id} />
                )}
            </>
        )
    }

    return isRepeatable ? renderTabs() : renderConditions()
}
