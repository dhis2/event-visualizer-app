import i18n from '@dhis2/d2-i18n'
import {
    Field,
    IconArrowRight16,
    InputField,
    SegmentedControl,
    colors,
} from '@dhis2/ui'
import { useEffect, useState, useMemo, type FC } from 'react'
import classes from './styles/period-dimension-modal-content.module.css'
import { PeriodDimension } from '@dhis2/analytics'
import {
    useAddMetadata,
    useAppCachedDataQuery,
    useAppDispatch,
    useAppSelector,
    useMetadataItems,
} from '@hooks'
import { getStartEndDate, isStartEndDate } from '@modules/dates'
import { getDimensionIdParts, getFullDimensionId } from '@modules/dimension.js'
import {
    getVisUiConfigItemsByDimension,
    getVisUiConfigOutputType,
    setVisUiConfigItemsByDimension,
} from '@store/vis-ui-config-slice.js'
import type { InternalDimensionRecord, PeriodType } from '@types'

export const OPTION_PRESETS = 'PRESETS'
export const OPTION_START_END_DATES = 'START_END_DATES'

type StartEndDateProps = {
    setValue: (value: string) => void
    value: string[]
}

const StartEndDate: FC<StartEndDateProps> = ({
    value: [startDateStr, endDateStr],
    setValue,
}) => {
    const [startDate, setStartDate] = useState(startDateStr)
    const [endDate, setEndDate] = useState(endDateStr)

    useEffect(() => {
        setValue(startDate && endDate ? `${startDate}_${endDate}` : '')
    }, [startDate, endDate, setValue])

    const onStartDateChange = ({ value }) => {
        setStartDate(value)
    }
    const onEndDateChange = ({ value }) => {
        setEndDate(value)
    }

    return (
        <Field
            helpText={i18n.t(
                'Start and end dates are inclusive and will be included in the outputs.'
            )}
        >
            <div className={classes.row}>
                <InputField
                    value={startDate}
                    type="date"
                    onChange={onStartDateChange}
                    label={i18n.t('Start date')}
                    inputWidth="200px"
                    max="9999-12-31"
                    dataTest="start-date-input"
                />
                <div className={classes.icon}>
                    <IconArrowRight16 color={colors.grey500} />
                </div>
                <InputField
                    value={endDate}
                    type="date"
                    onChange={onEndDateChange}
                    label={i18n.t('End date')}
                    inputWidth="200px"
                    max="9999-12-31"
                    dataTest="end-date-input"
                />
            </div>
        </Field>
    )
}

type PeriodDimensionModalContentProps = {
    dimension: InternalDimensionRecord
}

export const PeriodDimensionModalContent: FC<
    PeriodDimensionModalContentProps
> = ({ dimension }) => {
    const { systemSettings } = useAppCachedDataQuery()
    const dispatch = useAppDispatch()
    const addMetadata = useAddMetadata()

    const excludedPeriodTypes = useMemo(() => {
        const types: PeriodType[] = []

        if (systemSettings.hideDailyPeriods) {
            types.push('DAILY')
        }
        if (systemSettings.hideBiWeeklyPeriods) {
            types.push(
                'WEEKLY',
                'WEEKLYWED',
                'WEEKLYTHU',
                'WEEKLYSAT',
                'WEEKLYSUN'
            )
        }
        if (systemSettings.hideBiWeeklyPeriods) {
            types.push('BIWEEKLY')
        }
        if (systemSettings.hideMonthlyPeriods) {
            types.push('MONTHLY')
        }
        if (systemSettings.hideBiMonthlyPeriods) {
            types.push('BIMONTHLY')
        }
        return types
    }, [systemSettings])

    const selectedIds = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension?.id).map(
            (id) => getDimensionIdParts({ id }).dimensionId
        )
    )

    const selectedIdsMetadata = useMetadataItems(selectedIds)

    const [entryMethod, setEntryMethod] = useState(
        selectedIds.filter((id) => isStartEndDate(id)).length
            ? OPTION_START_END_DATES
            : OPTION_PRESETS
    )

    const outputType = useAppSelector(getVisUiConfigOutputType)

    const updatePeriodDimensionItems = (items) => {
        const { programId } = getDimensionIdParts({
            id: dimension.id,
            outputType,
        })

        const { uiItems, metadata } = items.reduce(
            (acc, item) => {
                const id = getFullDimensionId({
                    dimensionId: item.id,
                    programId,
                    outputType,
                })
                acc.uiItems.push(id)

                acc.metadata[item.id] = {
                    id: item.id,
                    name: isStartEndDate(item.id)
                        ? item.id.replace('_', ' - ')
                        : item.name,
                }

                return acc
            },
            { uiItems: [], metadata: {} }
        )

        addMetadata(metadata)

        dispatch(
            setVisUiConfigItemsByDimension({
                dimensionId: dimension.id,
                itemIds: uiItems,
            })
        )
    }

    const onSegmentedControlChange = ({ value }) => {
        if (value !== entryMethod) {
            setEntryMethod(value)
            updatePeriodDimensionItems([])
        }
    }

    return dimension ? (
        <>
            <div className={classes.navigation}>
                <SegmentedControl
                    options={[
                        {
                            label: i18n.t('Choose from presets'),
                            value: OPTION_PRESETS,
                        },
                        {
                            label: i18n.t('Define start - end dates'),
                            value: OPTION_START_END_DATES,
                        },
                    ]}
                    selected={entryMethod}
                    onChange={onSegmentedControlChange}
                ></SegmentedControl>
            </div>
            <div className={classes.entry}>
                {entryMethod === OPTION_PRESETS && (
                    <PeriodDimension
                        selectedPeriods={selectedIds.map((id) => ({
                            id,
                            name: selectedIdsMetadata[id]?.name,
                        }))}
                        onSelect={({ items }) =>
                            updatePeriodDimensionItems(items)
                        }
                        excludedPeriodTypes={excludedPeriodTypes}
                    />
                )}
                {entryMethod === OPTION_START_END_DATES && (
                    <StartEndDate
                        value={getStartEndDate(selectedIds[0] || '')}
                        setValue={(value) => {
                            if (!value && selectedIds.length) {
                                updatePeriodDimensionItems([])
                            } else if (value && value !== selectedIds[0]) {
                                updatePeriodDimensionItems([{ id: value }])
                            }
                        }}
                    />
                )}
            </div>
        </>
    ) : null
}
