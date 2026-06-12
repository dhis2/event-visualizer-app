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
} from '@dhis2/ui'
import {
    useAppDispatch,
    useAppSelector,
    useMetadataItem,
    useMetadataStore,
} from '@hooks'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'
import {
    getVisUiConfigCustomValue,
    setVisUiConfigCustomValue,
    setVisUiConfigOutputType,
} from '@store/vis-ui-config-slice'
import type { AggregationType } from '@types'
import { type FC, useCallback, useMemo, useState } from 'react'
import { CustomValueOption } from './custom-value-option'
import { StageNotice } from './stage-notice'
import classes from './styles/custom-value-modal.module.css'
import {
    useCustomValueDataElements,
    type CustomValueItem,
} from './use-custom-value-data-elements'

type CustomValueModalProps = {
    onClose: () => void
}

/* Many tracked entity attributes (and some data elements) carry a metadata
 * aggregation type of NONE, which renders every custom value cell as 0. Fall
 * back to AVERAGE so "Use item default" produces a meaningful value. */
const FALLBACK_AGGREGATION_TYPE: AggregationType = 'AVERAGE'

const resolveDefaultAggregationType = (
    item: CustomValueItem
): AggregationType =>
    item.aggregationType && item.aggregationType !== 'NONE'
        ? item.aggregationType
        : FALLBACK_AGGREGATION_TYPE

export const CustomValueModal: FC<CustomValueModalProps> = ({ onClose }) => {
    const dispatch = useAppDispatch()
    const metadataStore = useMetadataStore()
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const customValueMetadata = useMetadataItem(customValue?.id)
    const [aggregationType, setAggregationType] = useState<AggregationType>(
        customValue?.aggregationType ?? 'DEFAULT'
    )
    const [dataElementId, setDataElementId] = useState(customValue?.id)
    const [dataElement, setDataElement] = useState<CustomValueItem | undefined>(
        undefined
    )
    const [searchTerm, setSearchTerm] = useState('')

    const {
        dataElements,
        isLoading,
        isError,
        error,
        filteredByStageName,
        customValueStageMismatch,
    } = useCustomValueDataElements()

    const visibleDataElements = useMemo(() => {
        const term = searchTerm.trim().toLocaleLowerCase()
        if (!term) {
            return dataElements
        }
        return dataElements?.filter((dataElement) =>
            dataElement.name.toLocaleLowerCase().includes(term)
        )
    }, [dataElements, searchTerm])

    const onAggregationTypeChange = useCallback(
        ({ selected }) => setAggregationType(selected),
        []
    )

    const onDataElementChange = useCallback(
        (dataElement: CustomValueItem) => {
            setDataElementId(dataElement.id)
            setDataElement(dataElement)
            metadataStore.addMetadata(dataElement)
        },
        [metadataStore]
    )

    const onUpdate = useCallback(() => {
        const item =
            dataElement ?? dataElements?.find((d) => d.id === dataElementId)
        if (item) {
            dispatch(
                setVisUiConfigCustomValue({
                    aggregationType:
                        aggregationType === 'DEFAULT'
                            ? resolveDefaultAggregationType(item)
                            : aggregationType,
                    id: item.id,
                })
            )
            dispatch(setVisUiConfigOutputType('EVENT'))
            dispatch(tUpdateCurrentVisFromVisUiConfig(true))
        }

        onClose()
    }, [
        dispatch,
        aggregationType,
        dataElement,
        dataElements,
        dataElementId,
        onClose,
    ])

    return (
        <Modal onClose={onClose} position="top" large>
            <ModalTitle>{i18n.t('Configure custom value')}</ModalTitle>
            <ModalContent className={classes.content}>
                <p className={classes.description}>
                    {i18n.t(
                        'Choose the numeric data item to show in table cells.'
                    )}
                </p>
                <StageNotice
                    filteredByStageName={filteredByStageName}
                    customValueStageMismatch={customValueStageMismatch}
                    customValueDataElementName={customValueMetadata?.name}
                />
                {!isLoading && !isError && dataElements?.length !== 0 && (
                    <div className={classes.search}>
                        <InputField
                            value={searchTerm}
                            onChange={({ value }) => setSearchTerm(value ?? '')}
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
                                i18n.t('Failed to load data elements')}
                        </NoticeBox>
                    )}
                    {!isLoading && !isError && dataElements?.length === 0 && (
                        <NoticeBox
                            dense
                            title={
                                filteredByStageName
                                    ? i18n.t(
                                          'No numeric data items in stage "{{- stageName}}"',
                                          { stageName: filteredByStageName }
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
                        dataElements?.length !== 0 &&
                        visibleDataElements?.length === 0 && (
                            <div className={classes.noMatches}>
                                {i18n.t(
                                    'No data items match "{{- searchTerm}}"',
                                    { searchTerm }
                                )}
                            </div>
                        )}
                    {!isLoading &&
                        !isError &&
                        visibleDataElements?.map((dataElement) => (
                            <CustomValueOption
                                key={dataElement.id}
                                label={dataElement.name}
                                value={dataElement.id}
                                active={dataElementId === dataElement.id}
                                stageName={dataElement.stageName}
                                onClick={() => onDataElementChange(dataElement)}
                            />
                        ))}
                </div>
                <div className={classes.aggregationSelect}>
                    <SingleSelectField
                        label={i18n.t('Aggregation')}
                        onChange={onAggregationTypeChange}
                        selected={aggregationType}
                        dense
                    >
                        {AGGREGATION_TYPES.map((value) => (
                            <SingleSelectOption
                                key={value}
                                value={value}
                                label={aggregationTypeDisplayNames[value]}
                            />
                        ))}
                    </SingleSelectField>
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button type="button" secondary onClick={onClose}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        type="button"
                        primary
                        onClick={onUpdate}
                        disabled={!dataElementId}
                    >
                        {i18n.t('Update')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
