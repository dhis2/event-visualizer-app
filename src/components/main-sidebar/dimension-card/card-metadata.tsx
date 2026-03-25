import i18n from '@dhis2/d2-i18n'
import { useMemo, type FC } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import {
    useSelectedDimensionCount,
    type UseSelectedDimensionCountMatchFn,
} from '@components/main-sidebar/use-selected-dimension-count'
import type { DimensionMetadataItem } from '@types'

const getFixedDimensions = (): DimensionMetadataItem[] => [
    {
        id: 'lastUpdated',
        dimensionId: 'lastUpdated',
        name: i18n.t('Last updated on'),
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
    {
        id: 'lastUpdatedBy',
        dimensionId: 'lastUpdatedBy',
        name: i18n.t('Last updated by'),
        dimensionType: 'USER',
        valueType: 'USERNAME',
    },
    {
        id: 'created',
        dimensionId: 'created',
        name: i18n.t('Created on'),
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
    {
        id: 'createdBy',
        dimensionId: 'createdBy',
        name: i18n.t('Created by'),
        dimensionType: 'USER',
        valueType: 'USERNAME',
    },
    {
        id: 'completed',
        dimensionId: 'completed',
        name: i18n.t('Completed on'),
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
]

const METADATA_DIMENSION_IDS = new Set(
    getFixedDimensions().map((dimension) => dimension.id)
)

export const isSelectedMatchFn: UseSelectedDimensionCountMatchFn = (
    dimension
) => METADATA_DIMENSION_IDS.has(dimension.dimensionId)

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
