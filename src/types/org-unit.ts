import type { USER_ORG_UNITS } from '@constants/org-units'
import type { OrganisationUnit } from './dhis2-openapi-schemas'

export type UserOrgUnit = (typeof USER_ORG_UNITS)[number]

/* OrganisationUnit.id is optional in the generated schema but always set
 * at runtime; tighten it here so consumers don't have to assert. */
export type OrgUnit = Pick<OrganisationUnit, 'id' | 'name' | 'path'> & {
    id: string
}
