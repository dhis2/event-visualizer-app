import type { MatcherFn } from './matcher-functions'
import {
    createEnrollmentMatchFn,
    createEventWithoutRegistrationMatchFn,
    createProgramIndicatorsMatchFn,
    createProgramStageMatchFn,
    createProgramTrackedEntityTypeMatchFn,
    createTrackedEntityTypeMatchFn,
    metadataMatchFn,
    otherMatchFn,
} from './matcher-functions'
import {
    getEnrollmentFixedDimensions,
    getEventFixedDimensions,
    getTetFixedDimensions,
} from '@components/main-sidebar/fixed-dimensions'
import {
    isDataSourceProgramWithoutRegistration,
    isDataSourceProgramWithRegistration,
} from '@modules/data-source'
import type {
    DataSourceProgramWithoutRegistration,
    DataSourceProgramWithRegistration,
    DimensionCardKey,
    DimensionType,
    MetadataItem,
} from '@types'

const createProgramWithRegistrationAssigner = (
    programWithRegistration: DataSourceProgramWithRegistration
): Record<
    Extract<
        DimensionCardKey,
        | 'enrollment'
        | 'event-with-registration'
        | 'program-indicators'
        | 'program-tracked-entity-type'
        | 'metadata'
        | 'other'
    >,
    MatcherFn | Record<string, MatcherFn>
> => {
    const enrollmentTypeLookup = new Set<DimensionType>(
        getEnrollmentFixedDimensions(programWithRegistration).map(
            (dimension) => dimension.dimensionType
        )
    )
    return {
        enrollment: createEnrollmentMatchFn(
            programWithRegistration.id,
            enrollmentTypeLookup
        ),
        'event-with-registration':
            programWithRegistration.programStages!.reduce<
                Record<string, MatcherFn>
            >((stageRecord, stage) => {
                stageRecord[stage.id] = createProgramStageMatchFn(stage.id)
                return stageRecord
            }, {}),
        'program-indicators': createProgramIndicatorsMatchFn(
            programWithRegistration.id
        ),
        'program-tracked-entity-type': createProgramTrackedEntityTypeMatchFn(
            programWithRegistration.trackedEntityType.id
        ),
        metadata: metadataMatchFn,
        other: otherMatchFn,
    }
}

const createProgramWithoutRegistrationAssigner = (
    programWithoutRegistration: DataSourceProgramWithoutRegistration
): Record<
    Extract<
        DimensionCardKey,
        'event-without-registration' | 'metadata' | 'other'
    >,
    MatcherFn
> => {
    const programStage = programWithoutRegistration.programStages![0]
    const dimensionTypeLookup = new Set<DimensionType>(
        getEventFixedDimensions(programWithoutRegistration, programStage).map(
            (dimension) => dimension.dimensionType
        )
    ).add('DATA_ELEMENT')
    return {
        'event-without-registration': createEventWithoutRegistrationMatchFn(
            programStage.id,
            dimensionTypeLookup
        ),
        metadata: metadataMatchFn,
        other: otherMatchFn,
    }
}

const createTrackedEntityTypeAssigner = (
    trackedEntityType: MetadataItem
): Record<
    Extract<DimensionCardKey, 'tracked-entity-type' | 'metadata' | 'other'>,
    MatcherFn
> => {
    const fixedDimensionIdLookup = new Set(
        getTetFixedDimensions(trackedEntityType).map(
            (dimension) => dimension.id
        )
    )
    return {
        'tracked-entity-type': createTrackedEntityTypeMatchFn(
            trackedEntityType.id,
            fixedDimensionIdLookup
        ),
        metadata: metadataMatchFn,
        other: otherMatchFn,
    }
}

export const createDynamicCardAssigner = (
    dataSourceMetadataItem: MetadataItem
) => {
    if (isDataSourceProgramWithRegistration(dataSourceMetadataItem)) {
        return createProgramWithRegistrationAssigner(dataSourceMetadataItem)
    } else if (isDataSourceProgramWithoutRegistration(dataSourceMetadataItem)) {
        return createProgramWithoutRegistrationAssigner(dataSourceMetadataItem)
    } else {
        return createTrackedEntityTypeAssigner(dataSourceMetadataItem)
    }
}
