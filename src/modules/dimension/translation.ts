import {
    CONTEXTLESS_DIMENSION_TYPES,
    META_DIMENSION_IDS,
    WIRE_ONLY_DIMENSIONS,
} from '@modules/dimension/ids'
import type {
    CurrentVisualization,
    DimensionArray,
    OutputType,
    VisualizationType,
} from '@types'

export const transformDimensions = (
    dimensions: DimensionArray
): DimensionArray =>
    dimensions
        .filter(
            (dimensionObj) => !WIRE_ONLY_DIMENSIONS.has(dimensionObj.dimension)
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
 * The eventVisualizations API uses bare `ou` for both enrollment-scope and
 * TEI-registration-scope org units; these are distinguished only by the
 * presence/absence of a `program` qualifier on the dim record. Stage event OU
 * (with `programStage`) is a different concept and stays as `ou`.
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
        if (dim.dimension === 'ou' && !dim.programStage) {
            return { ...dim, dimension: 'enrollmentOu' }
        }
        return dim
    })

/**
 * Inverse: app-local dim → eventVisualizations POST `dimension` ID.
 *
 * `enrollmentOu` is the app-local ID for both program-scope enrollment OU
 * and TEI-registration-scope OU. The POST endpoint accepts it verbatim only
 * when it carries a program qualifier AND the visualization is in EVENT/TEI
 * `LINE_LIST` mode; otherwise it must be sent as bare `ou`. See the "Org
 * unit scopes" table in CLAUDE.md for the authoritative mapping.
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
    if (dimensionId !== 'enrollmentOu') {
        return dimensionId
    }
    const shouldRewriteToOu =
        !programId ||
        outputType === 'ENROLLMENT' ||
        visualizationType === 'PIVOT_TABLE'
    return shouldRewriteToOu ? 'ou' : 'enrollmentOu'
}
