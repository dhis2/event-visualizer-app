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
import { Transfer, TransferOption } from '@dhis2/ui'
import { useAddMetadata, useOptionSetMetadataItem } from '@hooks'
import { OPERATOR_IN } from '@modules/conditions'
import { type FC, useMemo } from 'react'
import { type FetchResult, optionsApi } from './options-api'

type OptionSetConditionProps = {
    condition: string
    optionSetId: string
    onChange: (condition: string) => void
}

export const OptionSetCondition: FC<OptionSetConditionProps> = ({
    condition,
    optionSetId,
    onChange,
}) => {
    const addMetadata = useAddMetadata()

    const dataTest = 'option-set'

    const parts = condition.split(':')
    const selectedIds = parts[1]?.length ? parts[1].split(';') : []

    const optionSetMetadata = useOptionSetMetadataItem(optionSetId)

    const selectedOptionsLookup = useMemo(
        () =>
            optionSetMetadata?.options.reduce<
                Record<string, { value: string; label: string }>
            >((lookupMap, { code, name }) => {
                lookupMap[code] = {
                    value: code,
                    label: name,
                }

                return lookupMap
            }, {}),
        [optionSetMetadata]
    )

    const [fetchOptionsFn, queryState] =
        optionsApi.useLazyFetchOptionsByOptionSetQuery()

    const {
        data: rawData,
        isLoading,
        isFetching,
        searchTerm,
        setSearchTerm,
        onEndReached,
    } = useInfiniteTransferOptions(optionSetId, fetchOptionsFn, queryState)

    const data = rawData as FetchResult['items']

    const setValues = (selected: string[]) => {
        const optionsMetadata = selected.reduce<FetchResult['items']>(
            (options, selectedId) => {
                const option = data?.find(({ code }) => code === selectedId)

                if (option) {
                    options.push(option)
                }

                return options
            },
            []
        )

        // add each single option
        // this is to keep the metadata store consistent, as the single options are also added when loading a visualization
        addMetadata(optionsMetadata)

        // add the optionSet so option labels can be looked up by code
        // (codes are not unique across option sets)
        const optionSetName =
            data?.[0]?.optionSet?.name ?? optionSetMetadata?.name

        if (!optionSetName) {
            throw new Error(
                `Could not resolve a name for option set "${optionSetId}"`
            )
        }

        addMetadata({
            ...(optionSetMetadata ?? {}),
            id: optionSetId,
            name: optionSetName,
            options: optionsMetadata,
        })

        onChange(`${OPERATOR_IN}:${selected.join(';') || ''}`)
    }

    const transferOptions = useMemo(
        () => data.map(({ code, name }) => ({ value: code, label: name })),
        [data]
    )

    return (
        <Transfer
            onChange={({ selected }) => setValues(selected)}
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
                    setSearchTerm={(value) => setSearchTerm(value ?? '')}
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
    )
}
