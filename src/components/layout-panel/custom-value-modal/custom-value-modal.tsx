import {
    AGGREGATION_TYPES,
    aggregationTypeDisplayNames,
} from '@constants/aggregation-types'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    CircularLoader,
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
import {
    getVisUiConfigCustomValue,
    setVisUiConfigCustomValue,
    setVisUiConfigLastActiveButton,
} from '@store/vis-ui-config-slice'
import type { AggregationType } from '@types'
import { type FC, useCallback, useState } from 'react'
import { CustomValueOption } from './custom-value-option'
import { StageNotice } from './stage-notice'
import classes from './styles/custom-value-modal.module.css'
import {
    useCustomValueDataElements,
    type CustomValueDataElement,
} from './use-custom-value-data-elements'

type CustomValueModalProps = {
    onClose: () => void
}

export const CustomValueModal: FC<CustomValueModalProps> = ({ onClose }) => {
    const dispatch = useAppDispatch()
    const metadataStore = useMetadataStore()
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const customValueMetadata = useMetadataItem(customValue?.id)
    const [aggregationType, setAggregationType] = useState<AggregationType>(
        customValue?.aggregationType ?? 'DEFAULT'
    )
    const [dataElementId, setDataElementId] = useState(customValue?.id)
    const [dataElement, setDataElement] = useState<
        CustomValueDataElement | undefined
    >(undefined)

    const {
        dataElements,
        isLoading,
        isError,
        error,
        filteredByStageName,
        customValueStageMismatch,
    } = useCustomValueDataElements()

    const onAggregationTypeChange = useCallback(
        ({ selected }) => setAggregationType(selected),
        []
    )

    const onDataElementChange = useCallback(
        (dataElement: CustomValueDataElement) => {
            setDataElementId(dataElement.id)
            setDataElement(dataElement)
            metadataStore.addMetadata(dataElement)
        },
        [metadataStore]
    )

    const onUpdate = useCallback(() => {
        if (dataElement) {
            dispatch(setVisUiConfigLastActiveButton('CUSTOM_VALUE'))
            dispatch(
                setVisUiConfigCustomValue({
                    aggregationType:
                        aggregationType === 'DEFAULT'
                            ? dataElement.aggregationType
                            : aggregationType,
                    id: dataElement.id,
                })
            )
        }

        onClose()
    }, [dispatch, aggregationType, dataElement, onClose])

    return (
        <Modal onClose={onClose} position="top" large>
            <ModalTitle>{i18n.t('Configure custom value')}</ModalTitle>
            <ModalContent className={classes.content}>
                <p className={classes.description}>
                    {i18n.t(
                        'Choose the numeric data element to show in table cells.'
                    )}
                </p>
                <StageNotice
                    filteredByStageName={filteredByStageName}
                    customValueStageMismatch={customValueStageMismatch}
                    customValueDataElementName={customValueMetadata?.name}
                />
                <div className={classes.listContainer}>
                    {isLoading && (
                        <div className={classes.listLoading}>
                            <CircularLoader extrasmall />
                            <span>{i18n.t('Loading data')}</span>
                        </div>
                    )}
                    {isError && (
                        <NoticeBox error title={i18n.t('Error loading data')}>
                            {error?.message ||
                                i18n.t('Failed to load data elements')}
                        </NoticeBox>
                    )}
                    {!isLoading && !isError && dataElements?.length === 0 && (
                        <NoticeBox
                            title={i18n.t(
                                'No numeric data items in this program'
                            )}
                        >
                            {i18n.t(
                                'This program does not have any numeric data elements available.'
                            )}
                        </NoticeBox>
                    )}
                    {!isLoading &&
                        !isError &&
                        dataElements?.map((dataElement) => (
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
                        disabled={!dataElement}
                    >
                        {i18n.t('Update')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
