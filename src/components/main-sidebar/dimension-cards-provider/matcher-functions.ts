import {
    EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES,
    METADATA_DIMENSION_IDS,
} from '@components/main-sidebar/fixed-dimensions'
import { isPopulatedString } from '@modules/validation'
import type { DimensionMetadataItem, DimensionType } from '@types'

export type MatcherFn = (item: DimensionMetadataItem) => boolean

// permanent cards (always visible, not tied to a data source)

export const metadataMatchFn: MatcherFn = (dimension) =>
    METADATA_DIMENSION_IDS.has(dimension.dimensionId)

export const otherMatchFn: MatcherFn = (dimension) =>
    dimension.dimensionType === 'ORGANISATION_UNIT_GROUP_SET'

// cards-program-without-registration

export const createEventWithoutRegistrationMatchFn =
    (
        programStageId: string,
        dimensionTypeLookup: Set<DimensionType>
    ): MatcherFn =>
    (dimension) =>
        dimensionTypeLookup.has(dimension.dimensionType) &&
        dimension.programStageId === programStageId

// cards-program-with-registration

export const createEnrollmentMatchFn =
    (programId: string, dimensionTypeLookup: Set<DimensionType>): MatcherFn =>
    (dimension) =>
        dimensionTypeLookup.has(dimension.dimensionType) &&
        dimension.programId === programId &&
        !dimension.programStageId

const EVENT_WITH_REGISTRATION_DIMENSION_TYPES = new Set<DimensionType>(
    EVENT_WITH_REGISTRATION_FIXED_DIMENSION_TYPES
).add('DATA_ELEMENT')

export const createEventWithRegistrationMatchFn =
    (stageIdLookup: Set<string>): MatcherFn =>
    (dimension) =>
        EVENT_WITH_REGISTRATION_DIMENSION_TYPES.has(dimension.dimensionType) &&
        isPopulatedString(dimension.programStageId) &&
        stageIdLookup.has(dimension.programStageId)

/* Stage-level matcher used by ProgramStageSubsection — counts dimensions
 * belonging to a single stage within a with-registration program */
export const createProgramStageMatchFn =
    (programStageId: string): MatcherFn =>
    (dimension) =>
        EVENT_WITH_REGISTRATION_DIMENSION_TYPES.has(dimension.dimensionType) &&
        dimension.programStageId === programStageId

export const createProgramIndicatorsMatchFn =
    (programId: string): MatcherFn =>
    (dimension) =>
        dimension.dimensionType === 'PROGRAM_INDICATOR' &&
        dimension.programId === programId

export const createProgramTrackedEntityTypeMatchFn =
    (trackedEntityTypeId: string): MatcherFn =>
    (dimension) => {
        if (dimension.id === `${trackedEntityTypeId}.ou`) {
            return true
        }
        /* TEAs fetched from the web api have plain IDs, no enrichment context,
         * they can only be identified by the absence of a program/stage */
        if (
            dimension.dimensionType === 'PROGRAM_ATTRIBUTE' &&
            !dimension.programId &&
            !dimension.programStageId
        ) {
            return true
        }
        return false
    }

// cards-tracked-entity-type

export const createTrackedEntityTypeMatchFn =
    (
        trackedEntityTypeId: string,
        fixedDimensionIdLookup: Set<string>
    ): MatcherFn =>
    (dimension) => {
        if (
            dimension.trackedEntityTypeId === trackedEntityTypeId &&
            fixedDimensionIdLookup.has(dimension.id)
        ) {
            return true
        }
        /* TEAs fetched from the web api have plain IDs, no enrichment context,
         * they can only be identified by the absence of a program/stage */
        if (
            dimension.dimensionType === 'PROGRAM_ATTRIBUTE' &&
            !dimension.programId &&
            !dimension.programStageId
        ) {
            return true
        }
        return false
    }
