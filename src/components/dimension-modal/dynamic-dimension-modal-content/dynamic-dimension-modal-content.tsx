import i18n from '@dhis2/d2-i18n'
import { Transfer, TransferOption } from '@dhis2/ui'
import { useMemo, type FC } from 'react'
import { dimensionsApi } from './dimensions-api'
import classes from './styles/dynamic-dimension-modal-content.module.css'
import { TransferEmptySelection } from './transfer-empty-selection'
import { TransferLeftHeader } from './transfer-left-header'
import { TransferRightHeader } from './transfer-right-header'
import { TransferSourceEmptyPlaceholder } from './transfer-source-empty-placeholder'
import { useInfiniteTransferOptions } from './use-infinite-transfer-options'
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

type DynamicDimensionModalContentProps = {
    dimension: InternalDimensionRecord
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
        data,
        isLoading,
        isFetching,
        searchTerm,
        setSearchTerm,
        onEndReached,
    } = useInfiniteTransferOptions(dimension.id, fetchOptionsFn, queryState)

    const updateDynamicDimensionItems = ({ selected }) => {
        const { uiItems, metadata } = data
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
                    options={data}
                    loading={isLoading || isFetching}
                    loadingPicked={isLoading}
                    sourceEmptyPlaceholder={
                        <TransferSourceEmptyPlaceholder
                            loading={isLoading}
                            searchTerm={searchTerm}
                            options={data}
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
