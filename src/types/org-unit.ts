import type { OrganisationUnit } from './dhis2-openapi-schemas'
import type { USER_ORG_UNITS } from '@constants/org-units'

export type UserOrgUnit = (typeof USER_ORG_UNITS)[number]

export type OrgUnit = Pick<OrganisationUnit, 'id' | 'name' | 'path'>
