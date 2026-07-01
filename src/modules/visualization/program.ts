import type { CurrentVisualization, Program, ProgramStage } from '@types'

export const getSingleProgramFromVisualization = (
    visualization: CurrentVisualization
): Program => {
    const programs = visualization.programDimensions ?? []
    if (programs.length !== 1) {
        throw new Error(
            `Expected exactly one program in programDimensions, found ${programs.length}`
        )
    }
    return programs[0]
}

export const getSingleProgramStageFromVisualization = (
    visualization: CurrentVisualization
): ProgramStage => {
    const program = getSingleProgramFromVisualization(visualization)
    const stages = program.programStages ?? []
    if (stages.length !== 1) {
        throw new Error(
            `Expected exactly one stage on program ${program.id}, found ${stages.length}`
        )
    }
    return stages[0]
}
