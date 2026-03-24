import type { ProgramStage as GeneratedProgramStage } from './dhis2-openapi-schemas'

/**
 * ProgramStage type with required id and name fields
 * Extends the generated ProgramStage type with our specific requirements
 */
export type ProgramStage = Pick<
    GeneratedProgramStage,
    | 'displayExecutionDateLabel'
    | 'displayDueDateLabel'
    | 'displayProgramStageLabel'
    | 'displayEventLabel'
    | 'hideDueDate'
    | 'repeatable'
> & {
    id: string
    name: string
    program: {
        id: string
    }
}
