/* ONLY PLACE GENERAL TYPES HERE WHICH ARE USED THROUGHOUT THE APP
 * Types exported from here can be imported as follows:
 * `import type { MyType } from '@types'` */
import type { ContextType } from '@dhis2/app-service-data'
import type { TransformedAppCachedData } from '../components/app-wrapper/app-cached-data-query-provider'
import type { ResponseErrorReport } from '@api/parse-engine-error'
/* We have an ESLint rule in place to prevent imports from
 * `src/types/dhis2-openapi-schemas` anywhere else in the codebase.
 * The reason for this is so that we can apply manual overrides
 * for generated types here, as we have done for `SystemSettings` */
/* eslint-disable import/export */
export type * from './dhis2-openapi-schemas'
export type { AxisType } from './axis-type'
export type { DimensionType } from './dimension'
export type { MetadataItem } from './metadata-item'
export type { SystemSettings } from './system-settings'
export type { VisualizationType } from './visualization-type'
/* eslint-enable import/export */
export type { PickWithFieldFilters } from './pick-with-field-filters'

/* The SingleQuery type is a simpler, but for our use-case functionally
 * equivalent, representation of the ResourceQuery internal to
 * @dhis2/app-service-data. The Query and Mutation types in that lib have
 * support for dynamic variables (functions), which we do not need because
 * RTK Query allows query object to be produced during runtime. They also
 * support some hypothetical variable types that currently are unsupported.
 * As such we could actually opt for manually creating a Query and Mutation
 * type here as well, which would produce more readable type hints */
export type SingleQuery = {
    resource: string
    id?: string
    data?: object | string
    params?: Record<
        string,
        number | string | boolean | Array<number | string | boolean>
    >
}
export type DataEngine = ContextType['engine']
export type QueryResult = Awaited<ReturnType<DataEngine['query']>>
export type MutationResult = {
    httpStatus: string
    httpStatusCode: number
    status: string
    response: {
        uid: string
        klass: string
        errorReports: Array<ResponseErrorReport>
        responseType: string
    }
}
export type { AppStore, AppDispatch, RootState } from '@store/store'
export type { UseMetadataStoreReturnValue as MetadataStore } from '../components/app-wrapper/metadata-provider'
export type AppCachedData = TransformedAppCachedData
export type CurrentUser = TransformedAppCachedData['currentUser']

export type {
    // DimensionType is exported above because it overrides the generated type
    ExtendedDimensionType,
    ProgramDimensionType,
    YourDimensionType,
    DimensionId,
    TimeDimensionId,
    InternalDimensionRecord,
} from './dimension'
export type * from './input-type'
export type * from './value-type'
export type * from './visualization'
