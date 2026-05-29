import i18n from '@dhis2/d2-i18n'
import { toEventVisualizationDimensionId } from '@modules/dimension'
import { parseUiRepetitions } from '@modules/repetitions'
import { isDimensionFullyInvalidForVisType } from '@modules/validation'
import { isValueTypeNumeric } from '@modules/value-type'
import {
    selectLayoutAllDimensionIds,
    type VisUiConfigState,
} from '@store/vis-ui-config-slice'
import type {
    Axis,
    CurrentVisualization,
    DimensionArray,
    DimensionMetadataItem,
    DimensionRecord,
    Layout,
    MetadataStore,
    Program,
    VisualizationType,
} from '@types'

export const getAxisName = (axisId: Axis): string => getAxisNames()[axisId]

export const getAxisNames = (): Record<Axis, string> => ({
    columns: i18n.t('Columns'),
    filters: i18n.t('Filter'),
    rows: i18n.t('Rows'),
})

export const isDimensionInLayout = (
    layout: Layout,
    dimensionId: string
): boolean =>
    Object.values(layout).some((axisDimensionIds) =>
        axisDimensionIds.includes(dimensionId)
    )

export const buildAxis = (
    dimensionIds: string[],
    visUiConfig: VisUiConfigState,
    metadataStore: MetadataStore
): DimensionArray =>
    dimensionIds.map((id) => {
        const dim = metadataStore.getDimensionMetadataItem(id)
        if (!dim) {
            throw new Error(
                `No metadata found for dimension "${id}" — cannot decompose compound ID for API`
            )
        }
        const itemIds = visUiConfig.itemsByDimension[id]
        const conditions = visUiConfig.conditionsByDimension[id]
        const repetitions = visUiConfig.repetitionsByDimension[id]
        const dimensionRecord: DimensionRecord = {
            dimension: toEventVisualizationDimensionId({
                dimensionId: dim.dimensionId ?? id,
                programId: dim.programId,
                outputType: visUiConfig.outputType,
                visualizationType: visUiConfig.visualizationType,
            }),
        }
        if (itemIds?.length) {
            dimensionRecord.items = itemIds.map((itemId) => ({ id: itemId }))
        }
        if (conditions?.condition) {
            dimensionRecord.filter = conditions.condition
        }
        if (conditions?.legendSet) {
            dimensionRecord.legendSet = { id: conditions.legendSet }
        }
        if (repetitions) {
            dimensionRecord.repetition = {
                indexes: parseUiRepetitions(repetitions),
            }
        }
        if (dim.programId) {
            dimensionRecord.program = { id: dim.programId }
        }
        if (dim.programStageId) {
            dimensionRecord.programStage = { id: dim.programStageId }
        }
        if (dim.dimensionType) {
            dimensionRecord.dimensionType = dim.dimensionType
        }
        if (dim.optionSetId) {
            dimensionRecord.optionSet = { id: dim.optionSetId }
        }
        if (dim.valueType) {
            dimensionRecord.valueType = dim.valueType
        }
        return dimensionRecord
    })

const getLayoutDimensionMetadataItems = (
    dimensionIds: string[],
    metadataStore: MetadataStore
): DimensionMetadataItem[] =>
    dimensionIds.map((id) => {
        const dim = metadataStore.getDimensionMetadataItem(id)
        if (!dim) {
            throw new Error(
                `No metadata found for dimension "${id}" in the layout`
            )
        }
        return dim
    })

export const collectProgramDimensions = (
    visUiConfig: VisUiConfigState,
    metadataStore: MetadataStore
): Program[] => {
    const layoutDims = getLayoutDimensionMetadataItems(
        selectLayoutAllDimensionIds(visUiConfig),
        metadataStore
    )
    const programsById = new Map<string, Program>()
    for (const dim of layoutDims) {
        const { programId } = dim
        if (!programId || programsById.has(programId)) {
            continue
        }
        const program = metadataStore.getProgramMetadataItem(programId)
        if (!program) {
            throw new Error(
                `Program "${programId}" referenced by dimension "${dim.id}" but not found in the metadata store`
            )
        }
        programsById.set(programId, program)
    }
    return Array.from(programsById.values())
}

type TeiFields = {
    trackedEntityType: CurrentVisualization['trackedEntityType']
    attributeDimensions: CurrentVisualization['attributeDimensions']
}

export const resolveProgramIds = (
    dimensionIds: string[],
    metadataStore: MetadataStore
): string[] => {
    const programIds = new Set<string>()
    for (const id of dimensionIds) {
        const programId = metadataStore.getDimensionMetadataItem(id)?.programId
        if (programId) {
            programIds.add(programId)
        }
    }
    return Array.from(programIds)
}

export const resolveProgramStageIds = (
    dimensionIds: string[],
    metadataStore: MetadataStore
): string[] => {
    const programStageIds = new Set<string>()
    for (const id of dimensionIds) {
        const programStageId =
            metadataStore.getDimensionMetadataItem(id)?.programStageId
        if (programStageId) {
            programStageIds.add(programStageId)
        }
    }
    return Array.from(programStageIds)
}

/* Any TET-bound layout dim can establish the layout's TET context:
 * TET-registration dims carry trackedEntityTypeId directly; any dim with a
 * programId resolves through the program's trackedEntityType (or none, for
 * event programs). Returns the first TET id found in layout iteration order.
 * Layouts that mix dims from multiple TETs are an invalid state surfaced by
 * the action buttons (which count TETs separately); this helper does not
 * police that — it just hands back the primary TET for callers that only need
 * a single id (TET metadata lookup, card-level "different TET" rule). */
export const resolveTetId = (
    dimensionIds: string[],
    metadataStore: MetadataStore
): string | null => {
    for (const dim of getLayoutDimensionMetadataItems(
        dimensionIds,
        metadataStore
    )) {
        if (dim.trackedEntityTypeId) {
            return dim.trackedEntityTypeId
        }
        if (dim.programId) {
            const tetId = metadataStore.getProgramMetadataItem(dim.programId)
                ?.trackedEntityType?.id
            if (tetId) {
                return tetId
            }
        }
    }
    return null
}

const EMPTY_AXIS_SET: ReadonlySet<Axis> = Object.freeze(
    new Set<Axis>()
) as ReadonlySet<Axis>
const COLUMNS_AND_ROWS: ReadonlySet<Axis> = Object.freeze(
    new Set<Axis>(['columns', 'rows'])
) as ReadonlySet<Axis>

/* Aggregatable dimensions are those that can serve as a column/row axis in
 * a pivot table: their value space is either a numeric scalar (which the
 * analytics engine can sum/average) or a controlled categorical vocabulary
 * (status enums, categories, COGS, OUGS, program indicators). Anything else
 * — per-record OUs, dates, free text, coordinates, user identifiers —
 * yields one bucket per record and isn't useful as a pivot axis. */
const ALWAYS_AGGREGATABLE_DIMENSION_TYPES: ReadonlySet<
    DimensionMetadataItem['dimensionType']
> = new Set([
    'PROGRAM_INDICATOR',
    'STATUS',
    'CATEGORY',
    'CATEGORY_OPTION_GROUP_SET',
    'ORGANISATION_UNIT_GROUP_SET',
])

export const isDimensionAggregatable = (
    dim: Partial<Pick<DimensionMetadataItem, 'dimensionType' | 'valueType'>>
): boolean => {
    if (
        dim.dimensionType &&
        ALWAYS_AGGREGATABLE_DIMENSION_TYPES.has(dim.dimensionType)
    ) {
        return true
    }
    return !!dim.valueType && isValueTypeNumeric(dim.valueType)
}

export const getInvalidAxesForDimension = (
    dim: Partial<Pick<DimensionMetadataItem, 'dimensionType' | 'valueType'>>,
    visType: VisualizationType
): ReadonlySet<Axis> => {
    if (visType === 'PIVOT_TABLE' && !isDimensionAggregatable(dim)) {
        return COLUMNS_AND_ROWS
    }
    return EMPTY_AXIS_SET
}

export const isAxisInvalidForDimension = (
    dim: Partial<Pick<DimensionMetadataItem, 'dimensionType' | 'valueType'>>,
    axis: Axis,
    visType: VisualizationType
): boolean => getInvalidAxesForDimension(dim, visType).has(axis)

export const getAllowedTargetAxis = (
    dims: ReadonlyArray<
        Partial<Pick<DimensionMetadataItem, 'dimensionType' | 'valueType'>>
    >,
    visType: VisualizationType
): Record<Axis, boolean> => {
    const allowed: Record<Axis, boolean> = {
        columns: true,
        rows: true,
        filters: true,
    }
    for (const dim of dims) {
        const invalid = getInvalidAxesForDimension(dim, visType)
        if (invalid.has('columns')) {
            allowed.columns = false
        }
        if (invalid.has('rows')) {
            allowed.rows = false
        }
        if (invalid.has('filters')) {
            allowed.filters = false
        }
    }
    return allowed
}

export type LayoutConversionResult = {
    newLayout: Layout
    discardedDimensionIds: string[]
}

const CONVERSION_AXIS_FALLBACK_ORDER: ReadonlyArray<Axis> = [
    'columns',
    'rows',
    'filters',
]

const pickAxisForConversion = (
    dim: DimensionMetadataItem,
    preferredAxis: Axis,
    targetVisType: VisualizationType
): Axis => {
    if (!isAxisInvalidForDimension(dim, preferredAxis, targetVisType)) {
        return preferredAxis
    }
    const invalid = getInvalidAxesForDimension(dim, targetVisType)
    const candidates = CONVERSION_AXIS_FALLBACK_ORDER.filter(
        (axis) => !(targetVisType === 'LINE_LIST' && axis === 'rows')
    )
    const fallback = candidates.find((axis) => !invalid.has(axis))
    /* `filters` is never in the invalid set under current rules, so this
     * branch always finds an axis. Default to filters as a final safety net. */
    return fallback ?? 'filters'
}

export const convertLayoutForVisType = ({
    layout,
    targetVisType,
    getDimension,
}: {
    layout: Layout
    targetVisType: VisualizationType
    getDimension: (id: string) => DimensionMetadataItem | undefined
}): LayoutConversionResult => {
    const newLayout: Layout = { columns: [], rows: [], filters: [] }
    const discardedDimensionIds: string[] = []

    /* Process filters first so a user's existing filter ordering is preserved
     * and any dimensions migrating to filters (e.g. non-aggregatable dims
     * moving out of PT cols/rows) are appended after them. Columns precedes
     * rows so that on PT -> LL the merged columns reads as cols ++ rows. */
    const sourceAxesInOrder: ReadonlyArray<Axis> = [
        'filters',
        'columns',
        'rows',
    ]

    for (const sourceAxis of sourceAxesInOrder) {
        for (const dimensionId of layout[sourceAxis]) {
            const dim = getDimension(dimensionId)
            if (!dim) {
                discardedDimensionIds.push(dimensionId)
                continue
            }
            if (isDimensionFullyInvalidForVisType(dim, targetVisType)) {
                discardedDimensionIds.push(dimensionId)
                continue
            }
            const preferredAxis: Axis =
                targetVisType === 'LINE_LIST' && sourceAxis === 'rows'
                    ? 'columns'
                    : sourceAxis
            const targetAxis = pickAxisForConversion(
                dim,
                preferredAxis,
                targetVisType
            )
            newLayout[targetAxis].push(dimensionId)
        }
    }

    return { newLayout, discardedDimensionIds }
}

export const resolveTeiFields = (
    visUiConfig: VisUiConfigState,
    metadataStore: MetadataStore
): TeiFields => {
    const dimensionIds = selectLayoutAllDimensionIds(visUiConfig)
    const layoutDims = getLayoutDimensionMetadataItems(
        dimensionIds,
        metadataStore
    )
    const { outputType } = visUiConfig

    const teaDims = layoutDims.filter(
        (dim) => dim.dimensionType === 'PROGRAM_ATTRIBUTE'
    )
    const attributeDimensions =
        teaDims.length > 0
            ? teaDims.map((dim) => ({
                  attribute: { id: dim.dimensionId, name: dim.name },
              }))
            : undefined

    const tetId = resolveTetId(dimensionIds, metadataStore)

    if (!tetId) {
        if (outputType === 'TRACKED_ENTITY_INSTANCE') {
            throw new Error(
                'Cannot resolve trackedEntityType for outputType=TRACKED_ENTITY_INSTANCE: the layout has no dimension carrying TET context'
            )
        }
        return { trackedEntityType: undefined, attributeDimensions }
    }

    const tet = metadataStore.getMetadataItem(tetId)
    if (!tet) {
        throw new Error(
            `Tracked entity type "${tetId}" referenced but not found in the metadata store`
        )
    }
    return {
        trackedEntityType: { id: tet.id, name: tet.name },
        attributeDimensions,
    }
}
