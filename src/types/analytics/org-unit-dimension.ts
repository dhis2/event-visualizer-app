import type { FC } from 'react'
import type { OrgUnit } from '@types'

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
