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
import { useMetadataStore, useStableCallback } from '@hooks'
import type { CustomValueObject } from '@store/vis-ui-config-slice'
import type { AggregationType } from '@types'
import { useEffect, useMemo, useState, type FC } from 'react'
import { CustomValueOption } from './custom-value-option'
import classes from './styles/custom-value-item-picker.module.css'
import { useCellValueItems } from './use-cell-value-items'

/* An item whose metadata aggregation type is NONE cannot be aggregated: the
 * analytics API returns 0 for every cell. Many tracked entity attributes (and
 * some data elements) carry NONE, so "Use item default" is disabled for them
 * and AVERAGE — a neutral numeric choice the user can override — is selected
 * instead. */
const FALLBACK_AGGREGATION_TYPE_FOR_NONE: AggregationType = 'AVERAGE'

type CustomValueItemPickerProps = {
    programId: string
    initialCustomValue: CustomValueObject | undefined
    /* Reports the choice ready to be stored — with the item's own aggregation
     * type already resolved — or undefined while no item is selected. */
    onChange: (customValue: CustomValueObject | undefined) => void
}

export const CustomValueItemPicker: FC<CustomValueItemPickerProps> = ({
    programId,
    initialCustomValue,
    onChange,
}) => {
    const metadataStore = useMetadataStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedItemId, setSelectedItemId] = useState(initialCustomValue?.id)
    const [aggregationType, setAggregationType] = useState<AggregationType>(
        initialCustomValue?.aggregationType ?? 'DEFAULT'
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

    const { selectedItemDefaultIsNone, selectedAggregationType, customValue } =
        useMemo(() => {
            const selectedItem = items?.find(
                (item) => item.id === selectedItemId
            )
            const selectedItemDefaultIsNone =
                selectedItem?.aggregationType === 'NONE'
            const itemDefaultAggregationType = selectedItemDefaultIsNone
                ? FALLBACK_AGGREGATION_TYPE_FOR_NONE
                : selectedItem?.aggregationType
            return {
                selectedItemDefaultIsNone,
                selectedAggregationType:
                    aggregationType === 'DEFAULT' && selectedItemDefaultIsNone
                        ? FALLBACK_AGGREGATION_TYPE_FOR_NONE
                        : aggregationType,
                customValue: selectedItem
                    ? {
                          id: selectedItem.id,
                          aggregationType:
                              aggregationType === 'DEFAULT'
                                  ? (itemDefaultAggregationType as AggregationType)
                                  : aggregationType,
                      }
                    : undefined,
            }
        }, [aggregationType, items, selectedItemId])

    /* The choice is only resolvable once the items are loaded, so it is
     * reported up rather than derived by the parent from the click alone. */
    const reportChange = useStableCallback(onChange)
    useEffect(() => {
        reportChange(customValue)
    }, [customValue, reportChange])

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
                            active={selectedItemId === item.id}
                            stageName={item.stageName}
                            onClick={() => {
                                metadataStore.addMetadata(item)
                                setSelectedItemId(item.id)
                            }}
                        />
                    ))}
            </div>
            <div className={classes.aggregationSelect}>
                <SingleSelectField
                    label={i18n.t('Aggregation')}
                    onChange={({ selected }: { selected: string }) =>
                        setAggregationType(selected as AggregationType)
                    }
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
