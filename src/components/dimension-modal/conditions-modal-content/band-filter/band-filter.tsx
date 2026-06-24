import { legendSetsApi } from '@components/dimension-modal/conditions-modal-content/numeric-condition/legend-sets-api'
import { TRANSFER_OPTIONS_WIDTH } from '@components/dimension-modal/transfer/transfer'
import { Transfer, TransferOption } from '@dhis2/ui'
import { OPERATOR_IN, parseCondition } from '@modules/conditions'
import { type FC, useMemo } from 'react'
import classes from './styles/band-filter.module.css'

type BandFilterProps = {
    legendSetId: string
    condition: string
    onChange: (condition: string) => void
}

const BAND_TRANSFER_HEIGHT = '240px'
const dataTest = 'band-filter'

export const BandFilter: FC<BandFilterProps> = ({
    legendSetId,
    condition,
    onChange,
}) => {
    const {
        data: legendSet,
        isLoading,
        isFetching,
    } = legendSetsApi.useGetLegendSetQuery(legendSetId)

    const selectedIds = useMemo(
        () => (parseCondition(condition) ?? []).filter(Boolean),
        [condition]
    )

    /* Source list in legend order (startValue) so bands read low-to-high; the
     * picked list keeps user-add/reorder order, which becomes the persisted
     * order in the IN: encoding below. */
    const options = useMemo(
        () =>
            [...(legendSet?.legends ?? [])]
                .sort((a, b) => a.startValue - b.startValue)
                .map((legend) => ({ value: legend.id, label: legend.name })),
        [legendSet]
    )

    const selectedOptionsLookup = useMemo(
        () =>
            options.reduce<Record<string, { value: string; label: string }>>(
                (lookup, option) => {
                    lookup[option.value] = option
                    return lookup
                },
                {}
            ),
        [options]
    )

    return (
        <Transfer
            onChange={({ selected }) =>
                onChange(
                    selected.length
                        ? `${OPERATOR_IN}:${selected.join(';')}`
                        : ''
                )
            }
            selected={selectedIds}
            selectedOptionsLookup={selectedOptionsLookup}
            options={options}
            loading={isLoading || isFetching}
            enableOrderChange
            height={BAND_TRANSFER_HEIGHT}
            optionsWidth={TRANSFER_OPTIONS_WIDTH}
            selectedWidth={TRANSFER_OPTIONS_WIDTH}
            className={classes.transfer}
            renderOption={(props) => (
                <TransferOption {...props} dataTest={`${dataTest}-option`} />
            )}
            dataTest={`${dataTest}-transfer`}
        />
    )
}
