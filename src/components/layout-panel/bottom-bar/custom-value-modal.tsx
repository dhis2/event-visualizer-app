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
import { type FC, useCallback, useMemo, useState } from 'react'
import classes from './styles/custom-value-modal.module.css'
import {
    AGGREGATION_TYPES,
    aggregationTypeDisplayNames,
} from '@constants/aggregation-types'
import { NUMERIC_VALUE_TYPES } from '@constants/value-types'
import {
    useAppDispatch,
    useAppSelector,
    useMetadataStore,
    useRtkQuery,
} from '@hooks'
import {
    getVisUiConfigCustomValue,
    getVisUiConfigLayout,
    setVisUiConfigCustomValue,
} from '@store/vis-ui-config-slice'
import type { AggregationType } from '@types'

type CustomValueModalProps = {
    onClose: () => void
}

type DataElementRecord = {
    id: string
    name: string
    aggregationType: AggregationType
}

export const CustomValueModal: FC<CustomValueModalProps> = ({ onClose }) => {
    const dispatch = useAppDispatch()
    const metadataStore = useMetadataStore()
    const layout = useAppSelector(getVisUiConfigLayout)
    const customValue = useAppSelector(getVisUiConfigCustomValue)
    const [aggregationType, setAggregationType] = useState<AggregationType>(
        customValue?.aggregationType ?? 'DEFAULT'
    )
    const [dataElementId, setDataElementId] = useState(customValue?.id)
    const [dataElement, setDataElement] = useState<
        DataElementRecord | undefined
    >(undefined)

    const programStageId: string = useMemo(() => {
        let programStageId

        Object.values(layout)
            .flat()
            .some((dimensionId) => {
                const dimensionMetadata =
                    metadataStore.getDimensionMetadataItem(dimensionId)

                if (dimensionMetadata?.programStageId) {
                    programStageId = dimensionMetadata.programStageId

                    return true
                }
            })

        return programStageId
    }, [layout, metadataStore])

    const { data, isLoading, isError, error } = useRtkQuery<
        Record<'dataElement', DataElementRecord>[]
    >({
        resource: `programStages/${programStageId}/programStageDataElements/gist`,
        params: {
            fields: 'dataElement[id,name,aggregationType]',
            filter: [
                // TODO: add BOOLEAN and TRUE_ONLY if/when backend suppors it
                `dataElement.valueType:in:[${NUMERIC_VALUE_TYPES.join(',')}]`,
            ],
            headless: true,
            pageSize: 1000,
        },
    })

    const onAggregationTypeChange = useCallback(
        ({ selected }) => setAggregationType(selected),
        []
    )

    const onDataElementChange = useCallback(
        (dataElement: DataElementRecord) => {
            setDataElementId(dataElement.id)
            setDataElement(dataElement)

            metadataStore.addMetadata(dataElement)
        },
        [metadataStore]
    )

    const onUpdate = useCallback(() => {
        if (dataElement) {
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
                <div className={classes.listContainer}>
                    {isLoading && (
                        <div className={classes.listLoading}>
                            <CircularLoader extrasmall />
                            <span>{i18n.t('Loading data')}</span>
                        </div>
                    )}
                    {!isError && error && (
                        <NoticeBox error title={i18n.t('Error loading data')}>
                            {error || i18n.t('Failed to load data elements')}
                        </NoticeBox>
                    )}
                    {!isLoading && !error && data.length === 0 && (
                        <NoticeBox title={i18n.t('No numeric data elements')}>
                            {i18n.t(
                                'This program does not have any numeric data elements available.'
                            )}
                        </NoticeBox>
                    )}
                    {!isLoading &&
                        !isError &&
                        data.map(({ dataElement }) => (
                            <SingleSelectOption
                                key={dataElement.id}
                                label={dataElement.name}
                                value={dataElement.id}
                                active={dataElementId === dataElement.id}
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
