import i18n from '@dhis2/d2-i18n'
import { useMemo } from 'react'
import {
    DimensionCard,
    DimensionList,
} from '@components/main-sidebar/dimension-card'
import { useDimensionList } from '@components/main-sidebar/use-dimension-list'
import type { DimensionMetadataItem } from '@types'

const getFixedDimensions = (): DimensionMetadataItem[] => [
    {
        id: 'lastUpdated',
        name: i18n.t('Last updated on'),
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
    {
        id: 'lastUpdatedBy',
        name: i18n.t('Last updated by'),
        dimensionType: 'USER',
        valueType: 'USERNAME',
    },
    {
        id: 'created',
        name: i18n.t('Created on'),
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
    {
        id: 'createdBy',
        name: i18n.t('Created by'),
        dimensionType: 'USER',
        valueType: 'USERNAME',
    },
    {
        id: 'completed',
        name: i18n.t('Completed on'),
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
]

export const CardMetadata = () => {
    const fixedDimensions = useMemo(getFixedDimensions, [])
    const listProps = useDimensionList({ fixedDimensions })

    return (
        <DimensionCard
            dimensionCardKey="metadata"
            title={i18n.t('Metadata')}
            isDisabledByFilter={listProps.isDisabledByFilter}
        >
            <DimensionList {...listProps} />
        </DimensionCard>
    )
}
