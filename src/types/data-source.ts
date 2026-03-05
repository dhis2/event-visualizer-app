import type { ProgramType } from './dhis2-openapi-schemas'
import type { DimensionType } from './dimension'
import type { MetadataItem } from './metadata'
import type { Program } from './program'

export type DataSourceProgramWithRegistration = Omit<
    Program,
    'programType' | 'trackedEntityType'
> & {
    programType: Extract<ProgramType, 'WITH_REGISTRATION'>
    // Required field for tracker program
    trackedEntityType: {
        id: string
        name: string
    }
}
export type DataSourceProgramWithoutRegistration = Omit<
    Program,
    'programType'
> & {
    programType: Extract<ProgramType, 'WITHOUT_REGISTRATION'>
}

export type DataSource =
    | DataSourceProgramWithRegistration
    | DataSourceProgramWithoutRegistration
    /* TrackedEntityType does not have any distinguishing features
     * it just has `id` and `name` */
    | MetadataItem

export type DataSourceFilter = Extract<
    DimensionType,
    | 'ORGANISATION_UNIT'
    | 'PERIOD'
    | 'STATUS'
    | 'DATA_ELEMENT'
    | 'PROGRAM_ATTRIBUTE'
    | 'PROGRAM_INDICATOR'
    | 'CATEGORY'
    | 'CATEGORY_OPTION_GROUP_SET'
>

export type DimensionCardKey =
    // program-with-registration data-source
    | 'enrollment'
    | 'event-with-registration'
    | 'program-indicators'
    | 'program-tracked-entity-type'
    // program-without-registration data-source
    | 'event-without-registration'
    // tracked-entity-type data-source
    | 'tracked-entity-type'
    // generic
    | 'metadata'
    | 'other'

export type DimensionListKey =
    | Exclude<
          DimensionCardKey,
          'enrollment' | 'event-with-registration' | 'metadata'
      >
    | `stage-${string}`
