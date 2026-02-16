import type { Program as GeneratedProgram } from './dhis2-openapi-schemas'
import type { ProgramStage } from './program-stage'

/**
 * Program type with required id and name fields
 * Extends the generated Program type with our specific requirements
 */
export type Program = Pick<
    GeneratedProgram,
    | 'programType'
    | 'displayIncidentDate'
    | 'displayEnrollmentDateLabel'
    | 'displayEnrollmentLabel'
    | 'displayEventLabel'
    | 'displayIncidentDateLabel'
    | 'displayOrgUnitLabel'
    | 'displayProgramStageLabel'
    | 'displayTrackedEntityAttributeLabel'
    | 'enrollmentDateLabel'
    | 'incidentDateLabel'
    | 'code'
> & {
    id: string
    name: string
    programStages?: ProgramStage[]
}
