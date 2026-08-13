import { useDimensionLegendSets } from '@components/dimension-modal/grouping-radio/use-dimension-legend-sets'
import {
    TRANSFER_HEIGHT,
    TRANSFER_OPTIONS_WIDTH,
    TRANSFER_SELECTED_WIDTH,
} from '@components/dimension-modal/transfer/transfer'
import { TransferEmptySelection } from '@components/dimension-modal/transfer/transfer-empty-selection'
import { TransferLeftHeader } from '@components/dimension-modal/transfer/transfer-left-header'
import { TransferRightHeader } from '@components/dimension-modal/transfer/transfer-right-header'
import { TransferSourceEmptyPlaceholder } from '@components/dimension-modal/transfer/transfer-source-empty-placeholder'
import i18n from '@dhis2/d2-i18n'
import { Transfer, TransferOption } from '@dhis2/ui'
import { OPERATOR_IN, parseCondition } from '@modules/conditions'
import type { DimensionMetadataItem } from '@types'
import { type FC, useMemo, useState } from 'react'

type LegendSetConditionProps = {
    condition: string
    dimension: DimensionMetadataItem
    legendSetId: string
    onChange: (condition: string) => void
}

export const LegendSetCondition: FC<LegendSetConditionProps> = ({
    condition,
    dimension,
    legendSetId,
    onChange,
}) => {
    const dataTest = 'legend-set'
    const [searchTerm, setSearchTerm] = useState('')

    /* Shares its cache entry with the grouping section's lookup, so resolving
     * the legends here costs no extra request. */
    const { legendSets, isLoading } = useDimensionLegendSets(dimension)

    const selectedIds = useMemo(
        () => (condition ? (parseCondition(condition) ?? []) : []),
        [condition]
    )

    const options = useMemo(() => {
        const legends =
            legendSets.find(({ id }) => id === legendSetId)?.legends ?? []

        return legends.map(({ id, name }) => ({ value: id, label: name }))
    }, [legendSets, legendSetId])

    /* All legends are already in memory, so the source list is filtered here
     * rather than by refetching. */
    const visibleOptions = useMemo(() => {
        if (!searchTerm) {
            return options
        }
        const term = searchTerm.toLowerCase()

        return options.filter((option) =>
            option.label.toLowerCase().includes(term)
        )
    }, [options, searchTerm])

    const selectedOptionsLookup = useMemo(
        () =>
            Object.fromEntries(options.map((option) => [option.value, option])),
        [options]
    )

    return (
        <Transfer
            onChange={({ selected }) =>
                onChange(`${OPERATOR_IN}:${selected.join(';')}`)
            }
            selected={selectedIds}
            selectedOptionsLookup={selectedOptionsLookup}
            options={visibleOptions}
            loading={isLoading}
            loadingPicked={isLoading}
            sourceEmptyPlaceholder={
                <TransferSourceEmptyPlaceholder
                    loading={isLoading}
                    searchTerm={searchTerm}
                    options={visibleOptions}
                    dataTest={`${dataTest}-empty-source`}
                />
            }
            leftHeader={
                <TransferLeftHeader
                    searchTerm={searchTerm}
                    setSearchTerm={(value) => setSearchTerm(value ?? '')}
                    title={i18n.t('Available groups')}
                    dataTest={`${dataTest}-left-header`}
                />
            }
            height={TRANSFER_HEIGHT}
            optionsWidth={TRANSFER_OPTIONS_WIDTH}
            selectedWidth={TRANSFER_SELECTED_WIDTH}
            selectedEmptyComponent={<TransferEmptySelection />}
            enableOrderChange
            rightHeader={
                <TransferRightHeader title={i18n.t('Selected groups')} />
            }
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
