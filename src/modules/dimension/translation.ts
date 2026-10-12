import {
    CONTEXTLESS_DIMENSION_TYPES,
    META_DIMENSION_IDS,
    DROPPED_LEGACY_DIMENSIONS,
} from '@modules/dimension/ids'
import type {
    CurrentVisualization,
    DimensionArray,
    DimensionRecord,
    OutputType,
    VisualizationType,
} from '@types'

export const transformDimensions = (
    dimensions: DimensionArray
): DimensionArray =>
    dimensions
        .filter(
            (dimensionObj) =>
                !DROPPED_LEGACY_DIMENSIONS.has(dimensionObj.dimension)
        )
        .map((dimensionObj) => {
            if (dimensionObj.dimensionType === 'PROGRAM_DATA_ELEMENT') {
                return {
                    ...dimensionObj,
                    dimensionType: 'DATA_ELEMENT',
                }
            }
            return dimensionObj
        })

/* Not persisted, so they are stripped before saving — and comparing them would
 * report a false positive anyway: a loaded visualization carries the API's
 * dimensionType (PROGRAM_DATA_ELEMENT) where one rebuilt from visUiConfig
 * carries the metadata store's (DATA_ELEMENT). */
const NON_PERSISTED_DIMENSION_PROPERTIES: ReadonlyArray<keyof DimensionRecord> =
    ['dimensionType', 'valueType']

export const removeNonPersistedDimensionProperties = (
    axis: DimensionArray
): DimensionArray =>
    axis.map((dim) => {
        const dimension = { ...dim }

        NON_PERSISTED_DIMENSION_PROPERTIES.forEach((property) => {
            delete dimension[property]
        })

        return dimension
    })

export const combineAllDimensionsFromVisualization = (
    visualization: CurrentVisualization
): DimensionArray => [
    ...(visualization.columns || []),
    ...(visualization.rows || []),
    ...(visualization.filters || []),
]

/* ---------------------------------------------------------------------------
 * Dimension ID translation between API and app-local layers.
 *
 * SavedVisualization/CurrentVisualization use API dimension IDs (e.g. `ou`
 * for enrollment org unit). The app-local layer (visUiConfig, metadata store)
 * uses distinct IDs (e.g. `enrollmentOu`). These functions translate at the
 * boundary.
 * --------------------------------------------------------------------------- */

/**
 * Forward: API → app-local dimension IDs on a DimensionArray.
 *
 * The eventVisualizations API uses bare `ou` for three org units, told apart
 * by their qualifiers: with a `programStage` it is the event OU, with only a
 * `program` the enrollment OU (app-local `enrollmentOu`), and with neither
 * the TEI registration OU. EVENT and ENROLLMENT visualizations store the
 * registration OU as `registrationOu` with a program qualifier, which is
 * dropped so it reads like the TEI one.
 */
export const toAppLocalDimensions = (dims: DimensionArray): DimensionArray =>
    dims.map((dim) => {
        if (
            (dim.dimensionType &&
                CONTEXTLESS_DIMENSION_TYPES.has(dim.dimensionType)) ||
            META_DIMENSION_IDS.has(dim.dimension)
        ) {
            const stripped = { ...dim }
            delete stripped.program
            delete stripped.programStage
            return stripped
        }
        if (dim.dimension === 'ou' && dim.program && !dim.programStage) {
            return { ...dim, dimension: 'enrollmentOu' }
        }
        if (dim.dimension === 'registrationOu') {
            const registrationOu = { ...dim, dimension: 'ou' }
            delete registrationOu.program
            return registrationOu
        }
        return dim
    })

/**
 * Inverse: app-local dim → eventVisualizations POST `dimension` ID.
 *
 * The registration OU is an `ou` without a program qualifier: bare `ou` for
 * TRACKED_ENTITY_INSTANCE and `registrationOu` otherwise. The POST endpoint
 * accepts the enrollment OU as `enrollmentOu` only in EVENT/TEI `LINE_LIST`
 * mode; otherwise it must be sent as bare `ou`. See the "Org unit scopes"
 * table in CLAUDE.md for the authoritative mapping.
 */
export const toEventVisualizationDimensionId = ({
    dimensionId,
    programId,
    outputType,
    visualizationType,
}: {
    dimensionId: string
    programId?: string
    outputType: OutputType
    visualizationType: VisualizationType
}): string => {
    if (dimensionId === 'ou' && !programId) {
        return outputType === 'TRACKED_ENTITY_INSTANCE'
            ? 'ou'
            : 'registrationOu'
    }
    if (dimensionId !== 'enrollmentOu') {
        return dimensionId
    }
    const shouldRewriteToOu =
        outputType === 'ENROLLMENT' || visualizationType === 'PIVOT_TABLE'
    return shouldRewriteToOu ? 'ou' : 'enrollmentOu'
}
