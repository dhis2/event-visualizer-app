import type { CurrentVisualization } from '@types'

/* The tracked entity type that keys the visualization's tracked entity
 * attributes. Only a tracked entity visualization carries one itself: the
 * backend reads a tracked entity type on any other as marking a multi-program
 * visualization. EVENT and ENROLLMENT take it from their tracker program. */
export const getTetId = (
    visualization: Pick<
        CurrentVisualization,
        'trackedEntityType' | 'programDimensions'
    >
): string | undefined =>
    visualization.trackedEntityType?.id ??
    visualization.programDimensions?.find(
        (program) => program.trackedEntityType
    )?.trackedEntityType?.id
