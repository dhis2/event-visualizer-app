import i18n from '@dhis2/d2-i18n'
import { toEventVisualizationDimensionId } from '@modules/dimension'
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
} from '@types'

export const getAxisName = (axisId: Axis): string => {
    switch (axisId) {
        case 'columns':
            return i18n.t('Columns')
        case 'filters':
            return i18n.t('Filter')
        case 'rows':
            return i18n.t('Rows')
    }
}

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

/* The layout's OU dim is the canonical source for TET context: TET-registration
 * ou carries trackedEntityTypeId directly; enrollment/stage ou carry a programId
 * whose program reference provides the TET (or none, for event programs). */
export const resolveTetId = (
    dimensionIds: string[],
    metadataStore: MetadataStore
): string | null => {
    const ouDim = getLayoutDimensionMetadataItems(
        dimensionIds,
        metadataStore
    ).find((dim) => dim.dimensionType === 'ORGANISATION_UNIT')
    return (
        ouDim?.trackedEntityTypeId ??
        (ouDim?.programId &&
            metadataStore.getProgramMetadataItem(ouDim.programId)
                ?.trackedEntityType?.id) ??
        null
    )
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
                'Cannot resolve trackedEntityType for outputType=TRACKED_ENTITY_INSTANCE: the layout has no organisation unit dimension carrying TET context'
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
