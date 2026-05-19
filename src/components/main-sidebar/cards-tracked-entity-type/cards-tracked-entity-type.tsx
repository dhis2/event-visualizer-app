import type { MetadataItem } from '@types'
import type { FC } from 'react'
import { CardTrackedEntityType } from './card-tracked-entity-type'

type CardsTrackedEntityTypeProps = {
    trackedEntityType: MetadataItem
}

export const CardsTrackedEntityType: FC<CardsTrackedEntityTypeProps> = ({
    trackedEntityType,
}) => <CardTrackedEntityType trackedEntityType={trackedEntityType} />
