import type {
    Program,
    ProgramType,
    TrackedEntity,
} from './dhis2-openapi-schemas'

export type DataSourceProgramWithRegistration = Omit<Program, 'programType'> & {
    programType: Extract<ProgramType, 'WITH_REGISTRATION'>
}
export type DataSourceProgramWithoutRegistration = Omit<
    Program,
    'programType'
> & {
    programType: Extract<ProgramType, 'WITHOUT_REGISTRATION'>
}
export type DataSourceTrackedEntity = TrackedEntity

export type DataSource =
    | DataSourceProgramWithRegistration
    | DataSourceProgramWithoutRegistration
    | DataSourceTrackedEntity
