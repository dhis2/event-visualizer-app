import type { TransferProps } from '@dhis2/ui'
import type { FC } from 'react'

type PeriodDimensionOnSelectPayload = {
    dimensionId: string
    items: string[]
}

type PeriodDimensionProps = {
    onSelect: ({ dimensionId, items }: PeriodDimensionOnSelectPayload) => void
    excludedPeriodTypes?: string[]
    height?: TransferProps['height']
    infoBoxMessage?: string
    rightFooter?: TransferProps['rightFooter']
    selectedPeriods?: { id: string; name?: string }[]
}

export type PeriodDimension = FC<PeriodDimensionProps>
