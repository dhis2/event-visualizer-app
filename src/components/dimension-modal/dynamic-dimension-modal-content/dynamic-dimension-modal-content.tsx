// eslint-disable-next-line no-restricted-imports
import i18n from '@dhis2/d2-i18n'
import { Transfer, TransferOption } from '@dhis2/ui'
import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
    type FC,
} from 'react'
import { useDebounceValue } from 'usehooks-ts'
import { dimensionsApi } from './dimensions-api'
import classes from './styles/dynamic-dimension-modal-content.module.css'
import { TransferEmptySelection } from './transfer-empty-selection'
import { TransferLeftHeader } from './transfer-left-header'
import { TransferRightHeader } from './transfer-right-header'
import { TransferSourceEmptyPlaceholder } from './transfer-source-empty-placeholder'
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

export type TransferItemRecord = {
    label: string
    value: string
    disabled: boolean
}

type DynamicDimensionModalContentProps = {
    dimension: InternalDimensionRecord
}

export const DynamicDimensionModalContent: FC<
    DynamicDimensionModalContentProps
> = ({ dimension }) => {
    const dispatch = useAppDispatch()
    const addMetadata = useAddMetadata()

    type ItemsReducerAction =
        | { type: 'APPEND_ITEMS'; payload: TransferItemRecord[] }
        | { type: 'REPLACE_ITEMS'; payload: TransferItemRecord[] }

    const itemsReducer = (
        state: TransferItemRecord[],
        action: ItemsReducerAction
    ): TransferItemRecord[] => {
        switch (action.type) {
            case 'APPEND_ITEMS':
                return [...state, ...action.payload]
            case 'REPLACE_ITEMS':
                return action.payload
        }
    }

    const [items, dispatchItems] = useReducer(itemsReducer, [])
    const [searchTerm, setSearchTerm] = useState<string | undefined>()
    const [debouncedSearchTerm] = useDebounceValue(searchTerm, 500)
    const debouncedSearchTermRef = useRef(debouncedSearchTerm)
    const nextPageRef = useRef<number | null>(null) //, setNextPage] = useState<number | null>()

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
        if (data) {
            if (data.dimensionItems.length) {
                console.log('new data', data.dimensionItems)
                const newItems: TransferItemRecord[] = data.dimensionItems.map(
                    ({ id, name, disabled }) => ({
                        label: name,
                        value: id,
                        disabled,
                    })
                )

                dispatchItems({
                    type: debouncedSearchTermRef.current
                        ? 'REPLACE_ITEMS'
                        : 'APPEND_ITEMS',
                    payload: newItems,
                })
            }

            console.log('set page', data.nextPage)
            //setNextPage(data.nextPage)
            nextPageRef.current = data.nextPage
        }
    }, [data])

    // fetch if dimension.id or searchTerm change
    useEffect(() => {
        console.log('dimensionId/search change')
        debouncedSearchTermRef.current = debouncedSearchTerm

        triggerFetchItems({
            dimensionId: dimension.id,
            searchTerm: debouncedSearchTerm,
            page: 1,
        })

        //setNextPage(null)
        nextPageRef.current = null
    }, [dimension.id, debouncedSearchTerm, triggerFetchItems])

    const onEndReached = useCallback(() => {
        console.log('end reached', nextPageRef.current)
        if (nextPageRef.current) {
            console.log('end reached and nextPage', nextPageRef.current)
            triggerFetchItems({
                dimensionId: dimension.id,
                searchTerm: debouncedSearchTermRef.current,
                page: nextPageRef.current,
            })
        }
    }, [dimension.id, triggerFetchItems])

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
                    options={[
                        ...items,
                        // remove items already in the option list to avoid duplication
                        ...selected.filter(
                            (selectedItem) =>
                                !items.find(
                                    (item) => item.value === selectedItem.value
                                )
                        ),
                    ]}
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
