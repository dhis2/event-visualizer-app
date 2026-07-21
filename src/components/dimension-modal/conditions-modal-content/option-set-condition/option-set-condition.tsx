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
import { logger } from '@modules/logger'
import { type FC, useMemo } from 'react'
import { type FetchResult, optionsApi } from './options-api'

type OptionSetConditionProps = {
    condition: string
    optionSetId: string
    onChange: (condition: string) => void
}

type Option = FetchResult['items'][number]
type OptionsByCode = Record<string, Option>

const indexOptionsByCode = (options: Option[] = []): OptionsByCode =>
    options.reduce<OptionsByCode>((byCode, option) => {
        byCode[option.code] = option
        return byCode
    }, {})

const toSelectedOptionsLookup = (
    optionsByCode: OptionsByCode
): Record<string, { value: string; label: string }> => {
    const lookup: Record<string, { value: string; label: string }> = {}
    for (const { code, name } of Object.values(optionsByCode)) {
        lookup[code] = { value: code, label: name }
    }
    return lookup
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

    const storedOptionsByCode = useMemo(
        () => indexOptionsByCode(optionSetMetadata?.options),
        [optionSetMetadata]
    )

    const selectedOptionsLookup = useMemo(
        () => toSelectedOptionsLookup(storedOptionsByCode),
        [storedOptionsByCode]
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
        /* The left-side search re-fetches, so `data` only holds options matching
         * the current search term. Resolve the selected options from the already
         * stored options as well, so selections made under an earlier search term
         * are not lost when a new one is added under a narrowed list. */
        const allOptionsByCode: OptionsByCode = {
            ...storedOptionsByCode,
            ...indexOptionsByCode(data),
        }

        const optionsMetadata = selected.reduce<FetchResult['items']>(
            (options, selectedId) => {
                const option = allOptionsByCode[selectedId]

                if (option) {
                    options.push(option)
                } else {
                    /* A selected code has no resolvable option when its option
                     * was deleted on the server: it is neither in the stored
                     * metadata nor returned by the options query. The code stays
                     * in the condition (see onChange below); only its label is
                     * unavailable. */
                    logger.error(
                        `Could not resolve option "${selectedId}" in option set "${optionSetId}"`
                    )
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
