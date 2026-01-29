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
