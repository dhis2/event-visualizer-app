import type { FC } from 'react'
import { CardType } from './card-type'
import type { MetadataItem } from '@types'

type CardsTrackedEntityTypeProps = {
    trackedEntityType: MetadataItem
}

export const CardsTrackedEntityType: FC<CardsTrackedEntityTypeProps> = ({
    trackedEntityType,
}) => {
    return <CardType trackedEntityType={trackedEntityType} />
}
