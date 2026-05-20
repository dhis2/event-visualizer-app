import {
    DimensionCard,
    DimensionList,
} from '@components/sidebar/dimension-card'
import { useDimensionList } from '@components/sidebar/use-dimension-list'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/sidebar/use-selected-dimension-count'
import i18n from '@dhis2/d2-i18n'
import { getFixedMetaDimensions, META_DIMENSION_IDS } from '@modules/dimension'
import { useMemo, type FC } from 'react'

const isSelectedMatchFn: UseSelectedDimensionCountMatchFn = (dimension) =>
    META_DIMENSION_IDS.has(dimension.dimensionId)

export const CardMetadata: FC = () => {
    const fixedDimensions = useMemo(getFixedMetaDimensions, [])
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
