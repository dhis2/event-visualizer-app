import type { OrgUnit } from '@types'
import type { FC } from 'react'

type OrgUnitDimensionSelectPayload = {
    dimensionId: string
    items: OrgUnit[]
}

type OrgUnitDimensionProps = {
    displayNameProp?: string
    hideGroupSelect?: boolean
    hideLevelSelect?: boolean
    hideUserOrgUnits?: boolean
    roots?: string[]
    selected?: OrgUnit[]
    warning?: string
    onSelect?: ({ dimensionId, items }: OrgUnitDimensionSelectPayload) => void
}

export type OrgUnitDimension = FC<OrgUnitDimensionProps>
