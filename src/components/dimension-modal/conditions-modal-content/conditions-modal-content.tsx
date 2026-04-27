import type { DimensionMetadataItem /*, ValueType */ } from '@types'
import type { FC } from 'react'
import { ConditionsTabContent } from './conditions-tab-content'

type ConditionsModalContentProps = {
    dimension: DimensionMetadataItem
}

export const ConditionsModalContent: FC<ConditionsModalContentProps> = ({
    dimension,
}) => {
    return <ConditionsTabContent dimension={dimension} />
}
