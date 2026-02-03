import type { ProgramType } from './dhis2-openapi-schemas'
import type { MetadataItemWithName, ProgramMetadataItem } from './metadata'

export type DataSourceProgramWithRegistration = Omit<
    ProgramMetadataItem,
    'programType'
> & {
    programType: Extract<ProgramType, 'WITH_REGISTRATION'>
}
export type DataSourceProgramWithoutRegistration = Omit<
    ProgramMetadataItem,
    'programType'
> & {
    programType: Extract<ProgramType, 'WITHOUT_REGISTRATION'>
}

export type DataSource =
    | DataSourceProgramWithRegistration
    | DataSourceProgramWithoutRegistration
    /* TrackedEntityType does not have any distinguishing features
     * it just has `id` and `name` */
    | MetadataItemWithName

export type DataSourceFilter =
    | 'ORG_UNITS'
    | 'PERIODS'
    | 'STATUSES'
    | 'DATA_ELEMENTS'
    | 'PROGRAM_ATTRIBUTES'
    | 'PROGRAM_INDICATORS'
    | 'CATEGORIES'
    | 'CATEGORY_OPTION_GROUP_SETS'
