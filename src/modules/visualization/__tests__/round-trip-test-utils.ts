import { transformProgramAttributes } from '@components/sidebar/cards-program-with-registration/card-tracked-entity-type'
import { transformTrackedEntityTypeAttributes } from '@components/sidebar/cards-tracked-entity-type/card-tracked-entity-type'
import { defaultTransformer } from '@components/sidebar/use-dimension-list/default-transformer'
import {
    getEnrollmentFixedDimensions,
    getFixedMetaDimensions,
    getStageFixedDimensions,
    getTrackedEntityTypeFixedDimensions,
} from '@modules/dimension/fixed'
import recordedDimensions from '@modules/visualization/__fixtures__/round-trip/sidebar/dimensions.json'
import recordedPrograms from '@modules/visualization/__fixtures__/round-trip/sidebar/programs.json'
import recordedTrackedEntityType from '@modules/visualization/__fixtures__/round-trip/sidebar/tracked-entity-type.json'
import type { DimensionMetadataItem, Program, ProgramStage } from '@types'

/* The ids the sidebar gives each kind of dimension, produced by the sidebar's
 * own code from responses recorded on the instance the saved fixtures come
 * from. A fixture's expected layout is written with these, so the suite never
 * restates how the sidebar builds an id. */

const programs = recordedPrograms as unknown as Record<string, Program>

const getProgram = (programId: string): Program => {
    const program = programs[programId]
    if (!program) {
        throw new Error(`No recorded program ${programId}`)
    }
    return program
}

const getStage = (programId: string, stageId: string): ProgramStage => {
    const stage = getProgram(programId).programStages?.find(
        ({ id }) => id === stageId
    )
    if (!stage) {
        throw new Error(`No recorded stage ${stageId} in program ${programId}`)
    }
    return stage as ProgramStage
}

const findId = (
    items: DimensionMetadataItem[],
    dimensionId: string,
    source: string
): string => {
    const item = items.find(
        ({ id, dimensionId: itemDimensionId }) =>
            itemDimensionId === dimensionId ||
            id === dimensionId ||
            id.endsWith(`.${dimensionId}`)
    )
    if (!item) {
        throw new Error(`The recorded ${source} has no ${dimensionId}`)
    }
    return item.id
}

const fromRecordedList = (
    response: unknown,
    dimensionId: string,
    source: string
) => findId(defaultTransformer(response).dimensions, dimensionId, source)

const getProgramTetId = (programId: string): string => {
    const tetId = getProgram(programId).trackedEntityType?.id
    if (!tetId) {
        throw new Error(`Program ${programId} has no tracked entity type`)
    }
    return tetId
}

export const sidebarIds = {
    stage: (programId: string, stageId: string, dimensionId: string) =>
        findId(
            getStageFixedDimensions(
                getProgram(programId),
                getStage(programId, stageId)
            ),
            dimensionId,
            `stage ${stageId} fixed dimensions`
        ),
    enrollment: (programId: string, dimensionId: string) =>
        findId(
            getEnrollmentFixedDimensions(getProgram(programId)),
            dimensionId,
            `program ${programId} enrollment dimensions`
        ),
    registration: (dimensionId: string) =>
        findId(
            getTrackedEntityTypeFixedDimensions(recordedTrackedEntityType),
            dimensionId,
            'registration dimensions'
        ),
    metadata: (dimensionId: string) =>
        findId(getFixedMetaDimensions(), dimensionId, 'metadata dimensions'),
    dataElement: (stageId: string, dataElementId: string) =>
        fromRecordedList(
            recordedDimensions.dataElements[
                stageId as keyof typeof recordedDimensions.dataElements
            ],
            dataElementId,
            `data elements of stage ${stageId}`
        ),
    programIndicator: (programId: string, programIndicatorId: string) =>
        fromRecordedList(
            recordedDimensions.eventProgramIndicators[
                programId as keyof typeof recordedDimensions.eventProgramIndicators
            ],
            programIndicatorId,
            `program indicators of program ${programId}`
        ),
    programAttribute: (programId: string, attributeId: string) =>
        findId(
            transformProgramAttributes(
                recordedDimensions.programAttributes[
                    programId as keyof typeof recordedDimensions.programAttributes
                ],
                getProgramTetId(programId)
            ).dimensions,
            attributeId,
            `attributes of program ${programId}`
        ),
    trackedEntityTypeAttribute: (attributeId: string) =>
        findId(
            transformTrackedEntityTypeAttributes(
                recordedTrackedEntityType,
                recordedTrackedEntityType.id
            ).dimensions,
            attributeId,
            'tracked entity type attributes'
        ),
    organisationUnitGroupSet: (groupSetId: string) =>
        fromRecordedList(
            recordedDimensions.organisationUnitGroupSets,
            groupSetId,
            'organisation unit group sets'
        ),
}
