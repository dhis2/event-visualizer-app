import type { Query } from '@dhis2/app-service-data'
import type { OrganisationUnit } from '../types/dhis2-openapi-schemas'
import { api } from './api'

export const orgUnitApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getOrgUnits: builder.query<OrganisationUnit, Query>({
            query: (query) => query,
        }),
    }),
    overrideExisting: false,
})
