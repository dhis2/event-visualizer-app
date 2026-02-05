import { CardType } from './card-type'
import type { MetadataItemWithName } from '@types'

type CardsTrackedEntityTypeProps = {
    trackedEntityType: MetadataItemWithName
}

export const CardsTrackedEntityType = ({
    trackedEntityType,
}: CardsTrackedEntityTypeProps) => {
    return <CardType trackedEntityType={trackedEntityType} />
}
