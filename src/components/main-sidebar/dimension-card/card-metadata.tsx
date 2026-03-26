import i18n from '@dhis2/d2-i18n'
import { useMemo, type FC } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useSelectedDimensionCount } from '@components/main-sidebar/dimension-cards-provider'
import { metadataMatchFn } from '@components/main-sidebar/dimension-cards-provider/matcher-functions'
import { getMetadataFixedDimensions } from '@components/main-sidebar/fixed-dimensions'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'

export const CardMetadata: FC = () => {
    const fixedDimensions = useMemo(getMetadataFixedDimensions, [])
    const listProps = useDimensionList({ fixedDimensions })
    const selectedCount = useSelectedDimensionCount(metadataMatchFn)

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
