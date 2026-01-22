import i18n from '@dhis2/d2-i18n'
import { Transfer, TransferOption } from '@dhis2/ui'
import { useMemo, type FC } from 'react'
import { dimensionsApi, type FetchResult } from './dimensions-api'
import classes from './styles/dynamic-dimension-modal-content.module.css'
import {
    TRANSFER_HEIGHT,
    TRANSFER_OPTIONS_WIDTH,
    TRANSFER_SELECTED_WIDTH,
} from '@components/dimension-modal/transfer/transfer'
import { TransferEmptySelection } from '@components/dimension-modal/transfer/transfer-empty-selection'
import { TransferLeftHeader } from '@components/dimension-modal/transfer/transfer-left-header'
import { TransferRightHeader } from '@components/dimension-modal/transfer/transfer-right-header'
import { TransferSourceEmptyPlaceholder } from '@components/dimension-modal/transfer/transfer-source-empty-placeholder'
import { useInfiniteTransferOptions } from '@components/dimension-modal/transfer/use-infinite-transfer-options'
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
import type { DimensionMetadataItem, MetadataItemWithName } from '@types'

type DynamicDimensionModalContentProps = {
    dimension: DimensionMetadataItem
}

export const DynamicDimensionModalContent: FC<
    DynamicDimensionModalContentProps
> = ({ dimension }) => {
    const dispatch = useAppDispatch()
    const addMetadata = useAddMetadata()
    const dataTest = `dynamic-dimension-${dimension.id}`
    const selectedIds = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension?.id).map(
            (id) => getDimensionIdParts({ id }).dimensionId
        )
    )
    const selectedIdsMetadata = useMetadataItems(selectedIds)
    const selectedOptionsLookup = useMemo(
        () =>
            selectedIds.reduce((lookupMap, id) => {
                const metadata = selectedIdsMetadata[id] as MetadataItemWithName

                lookupMap[id] = {
                    value: id,
                    label: metadata.name,
                }

                return lookupMap
            }, {}),
        [selectedIds, selectedIdsMetadata]
    )
    const [fetchOptionsFn, queryState] =
        dimensionsApi.useLazyFetchItemsByDimensionQuery()
    const {
        data: rawData,
        isLoading,
        isFetching,
        searchTerm,
        setSearchTerm,
        onEndReached,
    } = useInfiniteTransferOptions(dimension.id, fetchOptionsFn, queryState)

    const data = rawData as FetchResult['items']

    const updateDynamicDimensionItems = ({ selected }) => {
        const { uiItems, metadata } = data
            .filter((item) => selected.includes(item.id))
            .reduce(
                (acc, item) => {
                    acc.uiItems.push(item.id)

                    acc.metadata[item.id] = item

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

    const transferOptions = useMemo(
        () => data.map(({ id, name }) => ({ value: id, label: name })),
        [data]
    )

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
                    selected={selectedIds}
                    selectedOptionsLookup={selectedOptionsLookup}
                    options={transferOptions}
                    loading={isLoading || isFetching}
                    loadingPicked={isLoading}
                    sourceEmptyPlaceholder={
                        <TransferSourceEmptyPlaceholder
                            loading={isLoading}
                            searchTerm={searchTerm}
                            options={transferOptions}
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
