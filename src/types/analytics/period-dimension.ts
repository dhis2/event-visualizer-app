import type { TransferProps } from '@dhis2/ui'
import type { FC } from 'react'

type PeriodDimensionOnSelectPayload = {
    dimensionId: string // XXX: LayoutDimension['dimensionId']
    items: string[] // XXX: LayoutDimension['items']
}

type PeriodDimensionProps = {
    onSelect: ({ dimensionId, items }: PeriodDimensionOnSelectPayload) => void
    excludedPeriodTypes?: string[]
    height?: TransferProps['height']
    infoBoxMessage?: string
    rightFooter?: TransferProps['rightFooter'] // XXX: should this be derived from analytics components?
    selectedPeriods?: { id: string; name?: string }[]
}

export type PeriodDimension = FC<PeriodDimensionProps>
