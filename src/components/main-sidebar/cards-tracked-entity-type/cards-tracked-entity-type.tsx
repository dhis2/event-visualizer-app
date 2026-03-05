import type { FC } from 'react'
import { CardType } from './card-type'
import type { MetadataItemWithName } from '@types'

type CardsTrackedEntityTypeProps = {
    trackedEntityType: MetadataItemWithName
}

export const CardsTrackedEntityType: FC<CardsTrackedEntityTypeProps> = ({
    trackedEntityType,
}) => {
    return <CardType trackedEntityType={trackedEntityType} />
}
