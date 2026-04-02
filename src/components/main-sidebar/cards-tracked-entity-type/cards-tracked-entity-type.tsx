import type { FC } from 'react'
import { CardTrackedEntityType } from './card-tracked-entity-type'
import type { MetadataItem } from '@types'

type CardsTrackedEntityTypeProps = {
    trackedEntityType: MetadataItem
}

export const CardsTrackedEntityType: FC<CardsTrackedEntityTypeProps> = ({
    trackedEntityType,
}) => {
    return <CardTrackedEntityType trackedEntityType={trackedEntityType} />
}
