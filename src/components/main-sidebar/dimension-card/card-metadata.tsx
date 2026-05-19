import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/main-sidebar/use-selected-dimension-count'
import i18n from '@dhis2/d2-i18n'
import {
    getFixedDimensions,
    CONTEXTLESS_DIMENSION_IDS,
} from '@modules/dimension'
import { useMemo, type FC } from 'react'

const isSelectedMatchFn: UseSelectedDimensionCountMatchFn = (dimension) =>
    CONTEXTLESS_DIMENSION_IDS.has(dimension.dimensionId)

export const CardMetadata: FC = () => {
    const fixedDimensions = useMemo(getFixedDimensions, [])
    const listProps = useDimensionList({ fixedDimensions })
    const selectedCount = useSelectedDimensionCount(isSelectedMatchFn)

    return (
        <DimensionCard
            dimensionCardKey="metadata"
            title={i18n.t('Metadata')}
            isDisabledByFilter={listProps.isDisabledByFilter}
            selectedCount={selectedCount}
        >
            <DimensionList {...listProps} />
        </DimensionCard>
    )
}
