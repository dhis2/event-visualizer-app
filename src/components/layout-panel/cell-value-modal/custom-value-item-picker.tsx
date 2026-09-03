import {
    AGGREGATION_TYPES,
    aggregationTypeDisplayNames,
} from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import {
    CircularLoader,
    InputField,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import { useAppDispatch, useAppSelector, useMetadataStore } from '@hooks'
import {
    getVisUiConfigCustomValue,
    setVisUiConfigCustomValue,
} from '@store/vis-ui-config-slice'
import type { AggregationType } from '@types'
import { useMemo, useState, type FC } from 'react'
import { CustomValueOption } from './custom-value-option'
import classes from './styles/custom-value-item-picker.module.css'
import { useCellValueItems, type CustomValueItem } from './use-cell-value-items'

/* An item whose metadata aggregation type is NONE cannot be aggregated: the
 * analytics API returns 0 for every cell. Many tracked entity attributes (and
 * some data elements) carry NONE, so "Use item default" is disabled for them
 * and AVERAGE — a neutral numeric choice the user can override — is selected
 * instead. */
const FALLBACK_AGGREGATION_TYPE_FOR_NONE: AggregationType = 'AVERAGE'

const resolveAggregationType = (
    aggregationType: AggregationType,
    item: CustomValueItem
): AggregationType => {
    if (aggregationType !== 'DEFAULT') {
        return aggregationType
    }
    return item.aggregationType === 'NONE'
        ? FALLBACK_AGGREGATION_TYPE_FOR_NONE
        : item.aggregationType
}

export const CustomValueItemPicker: FC<{ programId: string }> = ({
    programId,
}) => {
    const dispatch = useAppDispatch()
    const metadataStore = useMetadataStore()
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const [searchTerm, setSearchTerm] = useState('')
    const [aggregationType, setAggregationType] = useState<AggregationType>(
        customValue?.aggregationType ?? 'DEFAULT'
    )
    const { items, isLoading, isError, error } = useCellValueItems(programId)

    const visibleItems = useMemo(() => {
        const term = searchTerm.trim().toLocaleLowerCase()
        if (!term) {
            return items
        }
        return items?.filter((item) =>
            item.name.toLocaleLowerCase().includes(term)
        )
    }, [items, searchTerm])

    const selectedItem = items?.find((item) => item.id === customValue?.id)
    const selectedItemDefaultIsNone = selectedItem?.aggregationType === 'NONE'
    const selectedAggregationType =
        aggregationType === 'DEFAULT' && selectedItemDefaultIsNone
            ? FALLBACK_AGGREGATION_TYPE_FOR_NONE
            : aggregationType

    const onItemClick = (item: CustomValueItem) => {
        metadataStore.addMetadata(item)
        dispatch(
            setVisUiConfigCustomValue({
                id: item.id,
                aggregationType: resolveAggregationType(aggregationType, item),
            })
        )
    }

    const onAggregationTypeChange = ({ selected }: { selected: string }) => {
        const nextAggregationType = selected as AggregationType
        setAggregationType(nextAggregationType)
        if (selectedItem) {
            dispatch(
                setVisUiConfigCustomValue({
                    id: selectedItem.id,
                    aggregationType: resolveAggregationType(
                        nextAggregationType,
                        selectedItem
                    ),
                })
            )
        }
    }

    return (
        <>
            {!isLoading && !isError && items?.length !== 0 && (
                <div className={classes.search}>
                    <InputField
                        value={searchTerm}
                        onChange={({ value }) => setSearchTerm(value ?? '')}
                        placeholder={i18n.t('Search data items')}
                        dataTest="custom-value-item-picker-search-field"
                        dense
                        initialFocus
                        type="search"
                    />
                </div>
            )}
            <div className={classes.listContainer}>
                {isLoading && (
                    <div className={classes.listLoading}>
                        <CircularLoader extrasmall />
                        <span>{i18n.t('Loading data')}</span>
                    </div>
                )}
                {isError && (
                    <NoticeBox error dense title={i18n.t('Error loading data')}>
                        {error?.message || i18n.t('Failed to load data items')}
                    </NoticeBox>
                )}
                {!isLoading && !isError && items?.length === 0 && (
                    <NoticeBox
                        dense
                        title={i18n.t('No numeric data items in this program')}
                    >
                        {i18n.t(
                            'This program does not have any numeric data items available.'
                        )}
                    </NoticeBox>
                )}
                {!isLoading &&
                    !isError &&
                    items?.length !== 0 &&
                    visibleItems?.length === 0 && (
                        <div className={classes.noMatches}>
                            {i18n.t('No data items match "{{- searchTerm}}"', {
                                searchTerm,
                            })}
                        </div>
                    )}
                {!isLoading &&
                    !isError &&
                    visibleItems?.map((item) => (
                        <CustomValueOption
                            key={item.id}
                            label={item.name}
                            value={item.id}
                            active={customValue?.id === item.id}
                            stageName={item.stageName}
                            onClick={() => onItemClick(item)}
                        />
                    ))}
            </div>
            <div className={classes.aggregationSelect}>
                <SingleSelectField
                    label={i18n.t('Aggregation')}
                    onChange={onAggregationTypeChange}
                    selected={selectedAggregationType}
                    dense
                >
                    {AGGREGATION_TYPES.map((value) => (
                        <SingleSelectOption
                            key={value}
                            value={value}
                            label={aggregationTypeDisplayNames[value]}
                            disabled={
                                value === 'DEFAULT' && selectedItemDefaultIsNone
                            }
                        />
                    ))}
                </SingleSelectField>
            </div>
        </>
    )
}
