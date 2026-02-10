import { getFullDimensionId } from './dimension'
import { isObject } from './validation'
import { layoutGetAllDimensions } from '@dhis2/analytics'
import {
    DEFAULT_REPETITIONS_OBJECT,
    type RepetitionsObject,
} from '@store/vis-ui-config-slice'
import type { CurrentVisualization, DimensionRecord } from '@types'

type SavedRepetitions = NonNullable<DimensionRecord['repetition']>['indexes']

export const getDefaultSavedRepetitions = (): SavedRepetitions => []

export const getRepetitionsFromVisualisation = (
    vis: CurrentVisualization
): Record<string, RepetitionsObject> =>
    layoutGetAllDimensions(vis)
        .filter((d) => d.repetition)
        .reduce((obj, d) => {
            obj[
                getFullDimensionId({
                    dimensionId: d.dimension,
                    programId: d.program?.id,
                    programStageId: d.programStage?.id,
                    outputType: vis.outputType,
                })
            ] = parseSavedRepetitions(d.repetition?.indexes)

            return obj
        }, {})

export const parseSavedRepetitions = (repetitions): RepetitionsObject => {
    if (
        !(
            Array.isArray(repetitions) &&
            repetitions.every((i) => Number.isFinite(i))
        )
    ) {
        throw new Error('parseSavedRepetitions: Invalid input')
    }

    return repetitions.length
        ? {
              mostRecent: repetitions.filter((n) => n < 1).length,
              oldest: repetitions.filter((n) => n > 0).length,
          }
        : DEFAULT_REPETITIONS_OBJECT
}

export const parseUiRepetitions = (
    repetitions: RepetitionsObject
): SavedRepetitions => {
    if (
        !(
            isObject(repetitions) &&
            Number.isFinite(repetitions.mostRecent) &&
            repetitions.mostRecent >= 0 &&
            Number.isFinite(repetitions.oldest) &&
            repetitions.oldest >= 0
        )
    ) {
        throw new Error('parseUiRepetitions: Invalid input')
    }

    // return empty repetitions indexes if oldest/mostRecent match the UI default
    // or it's an "invalid" combination
    if (repetitions.oldest === 0 && [0, 1].includes(repetitions.mostRecent)) {
        return getDefaultSavedRepetitions()
    }

    return [
        ...Array.from({ length: repetitions.oldest }, (_, i) => i + 1),
        ...Array.from(
            { length: repetitions.mostRecent },
            (_, i) => -i + 0
        ).sort((a, b) => a - b),
    ]
}
