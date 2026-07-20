import i18n from '@dhis2/d2-i18n'
import { isDimensionFullyInvalidForVisType } from '@modules/dimension/blocking'
import { toEventVisualizationDimensionId } from '@modules/dimension/translation'
import { parseUiRepetitions } from '@modules/repetitions'
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

/* A dimension's TET: TET-registration dims carry trackedEntityTypeId
 * directly; any dim with a programId resolves through the program's
 * trackedEntityType. Generic dims (period, org unit, metadata) have neither
 * and resolve to null. */
export const resolveDimensionTetId = (
    dim: DimensionMetadataItem,
    metadataStore: MetadataStore
): string | null => {
    if (dim.trackedEntityTypeId) {
        return dim.trackedEntityTypeId
    }
    if (dim.programId) {
        return (
            metadataStore.getProgramMetadataItem(dim.programId)
                ?.trackedEntityType?.id ?? null
        )
    }
    return null
}

export type LayoutContext = {
    programIds: string[]
    programStageIds: string[]
    tetId: string | null
}

/* The programs, program stages and tracked entity type the layout's dimensions
 * reference. tetId is the first one found in iteration order; layouts that mix
 * multiple TETs are an invalid state surfaced elsewhere (the action buttons
 * count TETs separately). Throws if a dimension id has no metadata in the
 * store, so callers must pass ids known to be present. */
export const resolveLayoutContext = (
    dimensionIds: string[],
    metadataStore: MetadataStore
): LayoutContext => {
    const programIds = new Set<string>()
    const programStageIds = new Set<string>()
    let tetId: string | null = null

    for (const dim of getLayoutDimensionMetadataItems(
        dimensionIds,
        metadataStore
    )) {
        if (dim.programId) {
            programIds.add(dim.programId)
        }
        if (dim.programStageId) {
            programStageIds.add(dim.programStageId)
        }
        if (!tetId) {
            tetId = resolveDimensionTetId(dim, metadataStore)
        }
    }

    return {
        programIds: Array.from(programIds),
        programStageIds: Array.from(programStageIds),
        tetId,
    }
}

type LayoutConversionResult = {
    newLayout: Layout
    discardedDimensionIds: string[]
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

    /* Process filters first so a user's existing filter ordering is preserved.
     * Columns precedes rows so that on PT -> LL the merged columns reads as
     * cols ++ rows. */
    const sourceAxesInOrder: ReadonlyArray<Axis> = [
        'filters',
        'columns',
        'rows',
    ]

    for (const sourceAxis of sourceAxesInOrder) {
        for (const dimensionId of layout[sourceAxis]) {
            const dim = getDimension(dimensionId)
            if (!dim) {
                throw new Error(
                    `No metadata found for dimension "${dimensionId}" — cannot convert layout for visualization type "${targetVisType}"`
                )
            }
            if (isDimensionFullyInvalidForVisType(dim, targetVisType)) {
                discardedDimensionIds.push(dimensionId)
                continue
            }
            const targetAxis: Axis =
                targetVisType === 'LINE_LIST' && sourceAxis === 'rows'
                    ? 'columns'
                    : sourceAxis
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

    const { tetId } = resolveLayoutContext(dimensionIds, metadataStore)

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
