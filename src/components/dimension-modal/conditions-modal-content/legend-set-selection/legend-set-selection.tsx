import { ConditionsSection } from '@components/dimension-modal/conditions-modal-content/conditions-section'
import { legendSetsApi } from '@components/dimension-modal/conditions-modal-content/numeric-condition/legend-sets-api'
import i18n from '@dhis2/d2-i18n'
import { IconLegend16, Radio, type RadioProps } from '@dhis2/ui'
import {
    useAppDispatch,
    useAppSelector,
    useLegendSetMetadataItem,
} from '@hooks'
import { isValueTypeNumeric } from '@modules/value-type'
import {
    getVisUiConfigConditionsByDimension,
    setVisUiConfigLegendSetByDimension,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem, DimensionType } from '@types'
import { useCallback, useEffect, useMemo, useRef, type FC } from 'react'
import classes from './styles/legend-set-selection.module.css'

const NO_LEGEND_VALUE = ''

const SUPPORTED_DIMENSION_TYPES: DimensionType[] = [
    'DATA_ELEMENT',
    'PROGRAM_INDICATOR',
    'PROGRAM_ATTRIBUTE',
]

type LegendSetSelectionProps = {
    dimension: DimensionMetadataItem
    onSectionVisibilityChange?: (isVisible: boolean) => void
}

export const LegendSetSelection: FC<LegendSetSelectionProps> = ({
    dimension,
    onSectionVisibilityChange,
}) => {
    const dispatch = useAppDispatch()
    const conditions = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimension.id)
    )
    const selectedLegendSetId = conditions.legendSet

    const isProgramIndicator = dimension.dimensionType === 'PROGRAM_INDICATOR'
    const canHaveLegendSets =
        isProgramIndicator ||
        (dimension.valueType !== undefined &&
            isValueTypeNumeric(dimension.valueType))

    const isSupportedType =
        canHaveLegendSets &&
        SUPPORTED_DIMENSION_TYPES.includes(dimension.dimensionType)

    const { data: legendSets, isLoading: isLoadingLegendSets } =
        legendSetsApi.useGetLegendSetsByDimensionQuery(
            {
                dimensionId: dimension.id,
                dimensionType: dimension.dimensionType,
            },
            { skip: !isSupportedType }
        )

    const selectedLegendSetMetadata =
        useLegendSetMetadataItem(selectedLegendSetId)

    const availableLegendSets = useMemo(() => {
        const options = [] as { id: string; name?: string }[]

        if (Array.isArray(legendSets)) {
            options.push(...legendSets)
        }

        if (
            selectedLegendSetId &&
            !options.find((option) => option.id === selectedLegendSetId)
        ) {
            options.push({
                id: selectedLegendSetId,
                name: selectedLegendSetMetadata?.name,
            })
        }

        return options
    }, [legendSets, selectedLegendSetId, selectedLegendSetMetadata?.name])
    const hasSets = Array.isArray(legendSets) && legendSets.length > 0
    const isSectionVisible =
        isSupportedType &&
        !isLoadingLegendSets &&
        (hasSets || Boolean(selectedLegendSetId))

    const setLegendSet = useCallback(
        (legendSet: string | undefined) =>
            dispatch(
                setVisUiConfigLegendSetByDimension({
                    dimensionId: dimension.id,
                    legendSet,
                })
            ),
        [dispatch, dimension.id]
    )

    /* Auto-pick the data element's first legend set when nothing is chosen yet,
     * once per mount. The modal remounts on each open, so a user who explicitly
     * picks "No legend" will see the default reapplied next time — acceptable
     * because the eventVisualization API can't distinguish "never set" from
     * "explicitly cleared" (both produce no legendSet on the dimension). */
    const autoSelectedRef = useRef(false)
    useEffect(() => {
        if (autoSelectedRef.current) {
            return
        }
        if (
            !isLoadingLegendSets &&
            !selectedLegendSetId &&
            Array.isArray(legendSets) &&
            legendSets.length > 0
        ) {
            autoSelectedRef.current = true
            setLegendSet(legendSets[0].id)
        }
    }, [
        dimension.id,
        isLoadingLegendSets,
        legendSets,
        selectedLegendSetId,
        setLegendSet,
    ])

    useEffect(() => {
        onSectionVisibilityChange?.(isSectionVisible)
    }, [isSectionVisible, onSectionVisibilityChange])

    const onChange = useCallback<NonNullable<RadioProps['onChange']>>(
        ({ value }) => {
            // Any explicit user choice — including "No legend" — should stop
            // future auto-selection within this mount.
            autoSelectedRef.current = true
            const selectedValue = value ?? NO_LEGEND_VALUE
            setLegendSet(
                selectedValue === NO_LEGEND_VALUE ? undefined : selectedValue
            )
        },
        [setLegendSet]
    )

    if (!isSectionVisible) {
        return null
    }

    return (
        <ConditionsSection
            title={i18n.t('Range grouping')}
            titleIcon={<IconLegend16 />}
            collapsible
            dataTest="dimension-popover-legend-section"
        >
            <div className={classes.radioList}>
                {availableLegendSets.map((item) => (
                    <Radio
                        name={`legend-set-${dimension.id}`}
                        key={item.id}
                        value={item.id}
                        label={item.name ?? item.id}
                        checked={selectedLegendSetId === item.id}
                        onChange={onChange}
                        dense
                        dataTest={`legend-set-option-${item.id}`}
                    />
                ))}
                <Radio
                    name={`legend-set-${dimension.id}`}
                    value={NO_LEGEND_VALUE}
                    label={i18n.t('No legend')}
                    checked={!selectedLegendSetId}
                    onChange={onChange}
                    dense
                    dataTest="legend-set-option-none"
                />
            </div>
        </ConditionsSection>
    )
}
