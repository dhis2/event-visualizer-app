import { RadioCard, RadioCards } from '@components/shared/radio-card/radio-card'
import {
    AGGREGATION_TYPES,
    aggregationTypeDisplayNames,
} from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    CircularLoader,
    InputField,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
    Tooltip,
} from '@dhis2/ui'
import {
    useAppDispatch,
    useAppSelector,
    useMetadataItem,
    useMetadataStore,
} from '@hooks'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import {
    clearVisUiConfigCustomValue,
    getVisUiConfigCustomValueByOutputType,
    setVisUiConfigCustomValue,
    setVisUiConfigOutputType,
} from '@store/vis-ui-config-slice'
import type { AggregationType, OutputType } from '@types'
import { type FC, useCallback, useMemo, useState } from 'react'
import { CustomValueOption } from './custom-value-option'
import { StageNotice } from './stage-notice'
import classes from './styles/custom-value-modal.module.css'
import {
    useCustomValueItems,
    type CustomValueItem,
} from './use-custom-value-items'

type CellValueMode = 'COUNT' | 'CUSTOM'

type CustomValueModalProps = {
    outputType: OutputType
    onClose: () => void
}

/* An item whose metadata aggregation type is NONE cannot be aggregated: the
 * analytics API returns 0 for every cell. Many tracked entity attributes (and
 * some data elements) carry NONE, so "Use item default" is disabled for them
 * and AVERAGE — a neutral numeric choice the user can override — is selected
 * instead. */
const FALLBACK_AGGREGATION_TYPE_FOR_NONE: AggregationType = 'AVERAGE'

export const CustomValueModal: FC<CustomValueModalProps> = ({
    outputType,
    onClose,
}) => {
    const dispatch = useAppDispatch()
    const metadataStore = useMetadataStore()
    const customValue = useAppSelector(getVisUiConfigCustomValueByOutputType)[
        outputType
    ]
    const customValueMetadata = useMetadataItem(customValue?.id)
    const [mode, setMode] = useState<CellValueMode>(
        customValue ? 'CUSTOM' : 'COUNT'
    )
    const [aggregationType, setAggregationType] = useState<AggregationType>(
        customValue?.aggregationType ?? 'DEFAULT'
    )
    const [selectedItemId, setSelectedItemId] = useState(customValue?.id)
    const [searchTerm, setSearchTerm] = useState('')

    const {
        items,
        isLoading,
        isError,
        error,
        filteredByStageName,
        customValueStageMismatch,
    } = useCustomValueItems()

    const visibleItems = useMemo(() => {
        const term = searchTerm.trim().toLocaleLowerCase()
        if (!term) {
            return items
        }
        return items?.filter((item) =>
            item.name.toLocaleLowerCase().includes(term)
        )
    }, [items, searchTerm])

    const onAggregationTypeChange = useCallback(
        ({ selected }: { selected: string }) =>
            setAggregationType(selected as AggregationType),
        []
    )

    const onItemChange = useCallback(
        (item: CustomValueItem) => {
            setSelectedItemId(item.id)
            metadataStore.addMetadata(item)
        },
        [metadataStore]
    )

    const { selectedItem, selectedItemDefaultIsNone, selectedAggregationType } =
        useMemo(() => {
            const selectedItem = items?.find(
                (item) => item.id === selectedItemId
            )
            const selectedItemDefaultIsNone =
                selectedItem?.aggregationType === 'NONE'
            const selectedAggregationType =
                aggregationType === 'DEFAULT' && selectedItemDefaultIsNone
                    ? FALLBACK_AGGREGATION_TYPE_FOR_NONE
                    : aggregationType
            return {
                selectedItem,
                selectedItemDefaultIsNone,
                selectedAggregationType,
            }
        }, [aggregationType, items, selectedItemId])

    const onUpdate = useCallback(() => {
        if (mode === 'COUNT') {
            dispatch(clearVisUiConfigCustomValue(outputType))
        } else if (selectedItem) {
            const itemDefaultAggregationType =
                selectedItem.aggregationType === 'NONE'
                    ? FALLBACK_AGGREGATION_TYPE_FOR_NONE
                    : selectedItem.aggregationType
            const resolvedAggregationType =
                aggregationType === 'DEFAULT'
                    ? itemDefaultAggregationType
                    : aggregationType
            dispatch(
                setVisUiConfigCustomValue({
                    outputType,
                    customValue: {
                        aggregationType: resolvedAggregationType,
                        id: selectedItem.id,
                    },
                })
            )
        }

        dispatch(setVisUiConfigOutputType(outputType))
        dispatch(tUpdateCurrentVisFromVisUiConfig())
        onClose()
    }, [dispatch, aggregationType, mode, outputType, selectedItem, onClose])

    const countHelpText =
        outputType === 'TRACKED_ENTITY_INSTANCE'
            ? i18n.t('Each cell shows the number of tracked entities.')
            : i18n.t('Each cell shows the number of events.')

    const canUpdate = mode === 'COUNT' || Boolean(selectedItemId)

    return (
        <Modal onClose={onClose} position="top" large>
            <ModalTitle>{i18n.t('Cell value')}</ModalTitle>
            <ModalContent className={classes.content}>
                <RadioCards>
                    <RadioCard
                        selected={mode === 'COUNT'}
                        label={i18n.t('Count')}
                        value="COUNT"
                        name="cell-value-mode"
                        dataTest="cell-value-count"
                        onSelect={() => setMode('COUNT')}
                        helpText={countHelpText}
                    />
                    <RadioCard
                        selected={mode === 'CUSTOM'}
                        label={i18n.t('Custom value')}
                        value="CUSTOM"
                        name="cell-value-mode"
                        dataTest="cell-value-custom"
                        onSelect={() => setMode('CUSTOM')}
                        helpText={i18n.t(
                            "Each cell shows a data item's value instead — for example, a total or average."
                        )}
                    >
                        <StageNotice
                            filteredByStageName={filteredByStageName}
                            customValueStageMismatch={customValueStageMismatch}
                            customValueItemName={customValueMetadata?.name}
                        />
                        {!isLoading && !isError && items?.length !== 0 && (
                            <div className={classes.search}>
                                <InputField
                                    value={searchTerm}
                                    onChange={({ value }) =>
                                        setSearchTerm(value ?? '')
                                    }
                                    placeholder={i18n.t('Search data items')}
                                    dataTest="custom-value-modal-search-field"
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
                                <NoticeBox
                                    error
                                    dense
                                    title={i18n.t('Error loading data')}
                                >
                                    {error?.message ||
                                        i18n.t('Failed to load data items')}
                                </NoticeBox>
                            )}
                            {!isLoading && !isError && items?.length === 0 && (
                                <NoticeBox
                                    dense
                                    title={
                                        filteredByStageName
                                            ? i18n.t(
                                                  'No numeric data items in stage "{{- stageName}}"',
                                                  {
                                                      stageName:
                                                          filteredByStageName,
                                                  }
                                              )
                                            : i18n.t(
                                                  'No numeric data items in this program'
                                              )
                                    }
                                >
                                    {filteredByStageName
                                        ? i18n.t(
                                              'This stage does not have any numeric data items available.'
                                          )
                                        : i18n.t(
                                              'This program does not have any numeric data items available.'
                                          )}
                                </NoticeBox>
                            )}
                            {!isLoading &&
                                !isError &&
                                items?.length !== 0 &&
                                visibleItems?.length === 0 && (
                                    <div className={classes.noMatches}>
                                        {i18n.t(
                                            'No data items match "{{- searchTerm}}"',
                                            { searchTerm }
                                        )}
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
                                        onClick={() => onItemChange(item)}
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
                                        label={
                                            aggregationTypeDisplayNames[value]
                                        }
                                        disabled={
                                            value === 'DEFAULT' &&
                                            selectedItemDefaultIsNone
                                        }
                                    />
                                ))}
                            </SingleSelectField>
                        </div>
                    </RadioCard>
                </RadioCards>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button type="button" secondary onClick={onClose}>
                        {i18n.t('Cancel')}
                    </Button>
                    {canUpdate ? (
                        <Button type="button" primary onClick={onUpdate}>
                            {i18n.t('Update')}
                        </Button>
                    ) : (
                        <Tooltip
                            content={i18n.t('Select a value before updating')}
                        >
                            {({
                                onMouseOver,
                                onMouseOut,
                                onFocus,
                                onBlur,
                                ref,
                            }) => (
                                <span
                                    onMouseOver={onMouseOver}
                                    onMouseOut={onMouseOut}
                                    onFocus={onFocus}
                                    onBlur={onBlur}
                                    ref={ref}
                                >
                                    <Button type="button" primary disabled>
                                        {i18n.t('Update')}
                                    </Button>
                                </span>
                            )}
                        </Tooltip>
                    )}
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
