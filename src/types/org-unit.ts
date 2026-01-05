import type { USER_ORG_UNITS } from '@constants/org-units'
import type { OrganisationUnit } from '@types'

export type UserOrgUnit = (typeof USER_ORG_UNITS)[number]

export type OrgUnit = Pick<OrganisationUnit, 'id' | 'name' | 'path'>
