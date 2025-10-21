// import {
//     noColumnsError,
//     noEntityTypeError,
//     noOrgUnitError,
//     noProgramError,
// } from './error'
// import {
// dimensionIsValid,
/*, layoutGetDimension */
// } from '@dhis2/analytics'
import type {
    OutputType,
    EventVisualizationType,
    // CurrentVisualization,
} from '@types'

// Layout validation helper functions
// Minimal local Layout type capturing fields used by this module.
// We keep it permissive to avoid depending on generated OpenAPI types
// while still providing useful type hints.
type Layout = {
    type?: EventVisualizationType
    outputType?: OutputType
    program?: { id?: string } | null
    trackedEntityType?: { id?: string } | null
    // columns?: Array<Record<string, unknown>> | null
    legacy?: boolean
    [k: string]: unknown
}

// const isAxisValid = (axis: unknown) =>
//     Array.isArray(axis) &&
//     (axis as unknown[]).some((axisItem) =>
//         dimensionIsValid(axisItem, {
//             requireItems: false,
//         })
//     )

// export const isLineListLayoutValid = (
//     layout: Layout | undefined,
//     isDryRun: boolean = false
// ) => {
//     if (!layout) {
//         return false
//     }

//     // entity type (outputType TE only)
//     if (
//         layout.outputType === 'TRACKED_ENTITY_INSTANCE' &&
//         !layoutHasTrackedEntityTypeId(layout)
//     ) {
//         if (isDryRun) {
//             return false
//         }
//         throw noEntityTypeError()
//     }

//     // program
//     if (
//         layout.outputType !== 'TRACKED_ENTITY_INSTANCE' &&
//         !layoutHasProgramId(layout)
//     ) {
//         if (isDryRun) {
//             return false
//         }
//         throw noProgramError()
//     }

//     // columns
//     if (!isAxisValid(layout.columns)) {
//         if (isDryRun) {
//             return false
//         }
//         throw noColumnsError()
//     }

//     // organisation unit
//     const ouDimension = layoutGetDimension(
//         layout as unknown as CurrentVisualization,
//         'ou'
//     )
//     if (
//         layout.outputType !== 'TRACKED_ENTITY_INSTANCE' &&
//         !(ouDimension && dimensionIsValid(ouDimension, { requireItems: true }))
//     ) {
//         if (isDryRun) {
//             return false
//         }
//         throw noOrgUnitError()
//     }

//     return true
// }

// export const validateLayout = (layout: Layout) => {
//     switch (layout.type) {
//         case 'LINE_LIST':
//         default:
//             return isLineListLayoutValid(layout)
//     }
// }

export const layoutHasProgramId = (layout: Layout | undefined) =>
    Boolean(layout?.program?.id)

export const layoutHasTrackedEntityTypeId = (layout: Layout | undefined) =>
    Boolean(layout?.trackedEntityType?.id)

export const aoCreatedInEventReportsApp = (layout: Layout | undefined) =>
    layout?.legacy

export const isLayoutValidForSave = (layout: Layout | undefined) =>
    layout?.outputType === 'TRACKED_ENTITY_INSTANCE'
        ? layoutHasTrackedEntityTypeId(layout)
        : layoutHasProgramId(layout) && !aoCreatedInEventReportsApp(layout)

export const isLayoutValidForSaveAs = (layout: Layout | undefined) =>
    layout?.outputType === 'TRACKED_ENTITY_INSTANCE'
        ? layoutHasTrackedEntityTypeId(layout)
        : layoutHasProgramId(layout)
