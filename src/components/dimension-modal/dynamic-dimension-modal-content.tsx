// eslint-disable-next-line no-restricted-imports
import i18n from '@dhis2/d2-i18n'
import { InputField, Transfer, TransferOption } from '@dhis2/ui'
import { useEffect, useMemo, useState, type FC } from 'react'
import { useDebounceValue } from 'usehooks-ts'
import classes from './styles/dynamic-dimension-modal-content.module.css'
import { dimensionsApi } from '@api/dimensions-api'
import {
    useAddMetadata,
    useAppDispatch,
    useAppSelector,
    useMetadataItems,
} from '@hooks'
import { getDimensionIdParts } from '@modules/dimension.js'
import {
    getVisUiConfigItemsByDimension,
    setVisUiConfigItemsByDimension,
} from '@store/vis-ui-config-slice.js'
import type { InternalDimensionRecord, MetadataItemWithName } from '@types'

const TRANSFER_OPTIONS_WIDTH = '359px'
const TRANSFER_SELECTED_WIDTH = '359px'
const TRANSFER_HEIGHT = '512px'

type TransferItemRecord = {
    label: string
    value: string
    disabled: boolean
}

const TransferEmptySelection: FC = () => (
    <p className={classes.transferEmptyList}>{i18n.t('No items selected')}</p>
)

type TransferSourceEmptyPlaceholderProps = {
    dataTest: string
    loading: boolean
    options: TransferItemRecord[]
    searchTerm?: string
}

const TransferSourceEmptyPlaceholder: FC<
    TransferSourceEmptyPlaceholderProps
> = ({ loading, searchTerm, options, dataTest }) =>
    !loading &&
    !options.length && (
        <p className={classes.transferEmptyList} data-test={dataTest}>
            {searchTerm
                ? i18n.t('Nothing found for "{{- searchTerm}}"', {
                      searchTerm: searchTerm,
                  })
                : i18n.t('No options')}
        </p>
    )

type TransferLeftHeaderProps = {
    dataTest: string
    searchTerm?: string
    setSearchTerm: (searchTerm?: string) => void
}

const TransferLeftHeader: FC<TransferLeftHeaderProps> = ({
    searchTerm,
    setSearchTerm,
    dataTest,
}) => (
    <div className={classes.transferLeftHeader}>
        <p className={classes.transferLeftTitle}>
            {i18n.t('Available options')}
        </p>
        <InputField
            value={searchTerm}
            onChange={({ value }) => setSearchTerm(value)}
            placeholder={i18n.t('Filter options')}
            dataTest={`${dataTest}-filter-input-field`}
            dense
            initialFocus
            type="search"
        />
    </div>
)

const TransferRightHeader: FC = () => (
    <p className={classes.transferRightHeader}>{i18n.t('Selected options')}</p>
)

type DynamicDimensionModalContentProps = {
    dimension: InternalDimensionRecord
}

export const DynamicDimensionModalContent: FC<
    DynamicDimensionModalContentProps
> = ({ dimension }) => {
    const dispatch = useAppDispatch()
    const addMetadata = useAddMetadata()

    const [items, setItems] = useState<TransferItemRecord[]>([])
    const [nextPage, setNextPage] = useState<number | null>()
    const [searchTerm, setSearchTerm] = useState<string | undefined>()
    const [debouncedSearchTerm] = useDebounceValue(searchTerm, 500)

    const dataTest = `dynamic-dimension-${dimension.id}`

    const selectedIds = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension?.id).map(
            (id) => getDimensionIdParts({ id }).dimensionId
        )
    )

    const selectedIdsMetadata = useMetadataItems(selectedIds)

    const selected = useMemo(
        () =>
            selectedIds.map((id) => {
                const metadata = selectedIdsMetadata[id] as MetadataItemWithName

                return {
                    value: id,
                    label: metadata.name,
                }
            }),
        [selectedIds, selectedIdsMetadata]
    )

    const [triggerFetchItems, { data, isLoading }] =
        dimensionsApi.useLazyFetchItemsByDimensionQuery()

    useEffect(() => {
        if (data?.dimensionItems.length) {
            const newItems: TransferItemRecord[] = data.dimensionItems.map(
                ({ id, name, disabled }) => ({
                    label: name,
                    value: id,
                    disabled,
                })
            )

            setItems(newItems)
        }

        if (data?.nextPage) {
            setNextPage(data.nextPage)
        }
    }, [data])

    // fetch if dimension.id or searchTerm change
    useEffect(() => {
        triggerFetchItems({
            dimensionId: dimension.id,
            searchTerm: debouncedSearchTerm,
            page: 1,
        })
    }, [dimension.id, debouncedSearchTerm, triggerFetchItems])

    const onEndReached = () => {
        if (nextPage) {
            triggerFetchItems({
                dimensionId: dimension.id,
                searchTerm,
                page: nextPage,
            })
        }
    }

    const updateDynamicDimensionItems = ({ selected }) => {
        const { uiItems, metadata } = items
            .filter((item) => selected.includes(item.value))
            .reduce(
                (acc, item) => {
                    acc.uiItems.push(item.value)

                    acc.metadata[item.value] = {
                        id: item.value,
                        name: item.label,
                    }

                    return acc
                },
                { uiItems: [] as string[], metadata: {} }
            )

        addMetadata(metadata)

        dispatch(
            setVisUiConfigItemsByDimension({
                dimensionId: dimension.id,
                itemIds: uiItems,
            })
        )
    }

    if (process.env.NODE_ENV !== 'production') {
        console.log(
            `dimensionType: ${dimension.dimensionType}, id: ${dimension.id}`
        )
    }

    return (
        <>
            <p className={classes.paragraph}>
                {i18n.t(
                    'Show items that meet the following conditions for this data item:'
                )}
            </p>
            <div className={classes.mainSection}>
                <Transfer
                    onChange={updateDynamicDimensionItems}
                    selected={selected.map((item) => item.value)}
                    options={[...items, ...selected]}
                    loading={isLoading}
                    loadingPicked={isLoading}
                    sourceEmptyPlaceholder={
                        <TransferSourceEmptyPlaceholder
                            loading={isLoading}
                            searchTerm={searchTerm}
                            options={items}
                            dataTest={`${dataTest}-empty-source`}
                        />
                    }
                    onEndReached={onEndReached}
                    leftHeader={
                        <TransferLeftHeader
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            dataTest={`${dataTest}-left-header`}
                        />
                    }
                    height={TRANSFER_HEIGHT}
                    optionsWidth={TRANSFER_OPTIONS_WIDTH}
                    selectedWidth={TRANSFER_SELECTED_WIDTH}
                    selectedEmptyComponent={<TransferEmptySelection />}
                    rightHeader={<TransferRightHeader />}
                    renderOption={(props) => (
                        <TransferOption
                            {...props}
                            dataTest={`${dataTest}-transfer-option`}
                        />
                    )}
                    dataTest={`${dataTest}-transfer`}
                />
            </div>
        </>
    )
}
