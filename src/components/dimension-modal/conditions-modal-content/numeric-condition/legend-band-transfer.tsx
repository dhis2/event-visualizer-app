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
import { OPERATOR_IN } from '@modules/conditions'
import { type FC, useMemo, useState } from 'react'
import { legendSetsApi } from './legend-sets-api'

const DATA_TEST = 'legend-band'

type LegendBandTransferProps = {
    legendSetId: string
    condition: string
    onChange: (condition: string) => void
}

/* The grouped filter: pick which of the legend set's bands to keep. A Transfer
 * (mirroring the option-set filter) replaces a single operator row because the
 * selection is inherently a reorderable set, not one comparison. The selected
 * order is preserved and sent as the `IN:` condition's band id list. */
export const LegendBandTransfer: FC<LegendBandTransferProps> = ({
    legendSetId,
    condition,
    onChange,
}) => {
    const [searchTerm, setSearchTerm] = useState('')

    const { data: legendSet, isFetching } = legendSetsApi.useGetLegendSetQuery(
        legendSetId,
        { skip: !legendSetId }
    )

    const bands = useMemo(
        () =>
            [...(legendSet?.legends ?? [])].sort(
                (a, b) => a.startValue - b.startValue
            ),
        [legendSet]
    )

    /* All bands, so a selected band keeps its label even while filtered out of
     * the source list by the search term. */
    const selectedOptionsLookup = useMemo(
        () =>
            bands.reduce<Record<string, { value: string; label: string }>>(
                (lookup, { id, name }) => {
                    lookup[id] = { value: id, label: name }

                    return lookup
                },
                {}
            ),
        [bands]
    )

    const options = useMemo(
        () =>
            bands
                .filter(({ name }) =>
                    name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(({ id, name }) => ({ value: id, label: name })),
        [bands, searchTerm]
    )

    const selectedIds =
        condition.split(':')[1]?.split(';').filter(Boolean) ?? []

    return (
        <Transfer
            onChange={({ selected }) =>
                onChange(`${OPERATOR_IN}:${selected.join(';')}`)
            }
            selected={selectedIds}
            selectedOptionsLookup={selectedOptionsLookup}
            options={options}
            loading={isFetching}
            loadingPicked={isFetching}
            enableOrderChange
            height={TRANSFER_HEIGHT}
            optionsWidth={TRANSFER_OPTIONS_WIDTH}
            selectedWidth={TRANSFER_SELECTED_WIDTH}
            selectedEmptyComponent={<TransferEmptySelection />}
            sourceEmptyPlaceholder={
                <TransferSourceEmptyPlaceholder
                    loading={isFetching}
                    searchTerm={searchTerm}
                    options={options}
                    dataTest={`${DATA_TEST}-empty-source`}
                />
            }
            leftHeader={
                <TransferLeftHeader
                    searchTerm={searchTerm}
                    setSearchTerm={(value) => setSearchTerm(value ?? '')}
                    title={i18n.t('Available groups')}
                    filterPlaceholder={i18n.t('Filter groups')}
                    dataTest={`${DATA_TEST}-left-header`}
                />
            }
            rightHeader={
                <TransferRightHeader title={i18n.t('Selected groups')} />
            }
            renderOption={(props) => (
                <TransferOption
                    {...props}
                    dataTest={`${DATA_TEST}-transfer-option`}
                />
            )}
            dataTest={`${DATA_TEST}-transfer`}
        />
    )
}
