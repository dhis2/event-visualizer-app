import {
    DimensionCard,
    DimensionList,
    DimensionListItem,
} from '@components/main-sidebar/dimension-card'
import type { MetadataItemWithName } from '@types'

type CardTypeProps = {
    trackedEntityType: MetadataItemWithName
}

export const CardType = ({
    trackedEntityType, // eslint-disable-line @typescript-eslint/no-unused-vars
}: CardTypeProps) => {
    // TODO: Use trackedEntityType props when implementing API
    const label = 'Person registration'

    return (
        <DimensionCard dimensionCardKey="tracked-entity-type" title={label}>
            <DimensionList>
                <DimensionListItem />
                <DimensionListItem />
            </DimensionList>
        </DimensionCard>
    )
}
