import {
    DimensionCard,
    DimensionList,
    DimensionListItem,
} from '@components/main-sidebar/dimension-card'

// Metadata dimension IDs based on specifications
const METADATA_DIMENSIONS = [
    'lastUpdatedOn',
    'lastUpdatedBy',
    'createdOn',
    'createdBy',
    'completedOn',
] as const

export const CardMetadata = () => {
    return (
        <DimensionCard dimensionCardKey="metadata" title="Metadata">
            <DimensionList>
                {METADATA_DIMENSIONS.map((dimensionId) => (
                    <DimensionListItem key={dimensionId} />
                ))}
            </DimensionList>
        </DimensionCard>
    )
}
