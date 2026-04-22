import { dimensionCreate } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { toApiDimensionId } from '@modules/dimension'
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
    Layout,
    MetadataStore,
    Program,
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
    dimensionIds
        .map((id) => {
            const dim = metadataStore.getDimensionMetadataItem(id)
            if (!dim) {
                throw new Error(
                    `No metadata found for dimension "${id}" — cannot decompose compound ID for API`
                )
            }
            const dimensionId = dim.dimensionId ?? id
            const conditions = visUiConfig.conditionsByDimension[id]
            const repetitions = visUiConfig.repetitionsByDimension[id]
            const options: Record<string, unknown> = {}
            if (conditions?.condition) {
                options.filter = conditions.condition
            }
            if (conditions?.legendSet) {
                options.legendSet = { id: conditions.legendSet }
            }
            if (repetitions) {
                options.repetition = {
                    indexes: parseUiRepetitions(repetitions),
                }
            }
            if (dim.programId) {
                options.program = { id: dim.programId }
            }
            if (dim.programStageId) {
                options.programStage = { id: dim.programStageId }
            }
            return dimensionCreate(
                toApiDimensionId(dimensionId, {
                    outputType: visUiConfig.outputType,
                    visType: visUiConfig.visualizationType,
                }),
                visUiConfig.itemsByDimension[id],
                options
            )
        })
        .filter((dim): dim is DimensionArray[number] => dim !== null)

const getLayoutDims = (
    visUiConfig: VisUiConfigState,
    metadataStore: MetadataStore
): DimensionMetadataItem[] =>
    selectLayoutAllDimensionIds(visUiConfig).map((id) => {
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
    const layoutDims = getLayoutDims(visUiConfig, metadataStore)
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

export const resolveTeiFields = (
    visUiConfig: VisUiConfigState,
    metadataStore: MetadataStore
): TeiFields => {
    const layoutDims = getLayoutDims(visUiConfig, metadataStore)
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

    const needsTrackedEntityType =
        outputType === 'TRACKED_ENTITY_INSTANCE' ||
        (outputType === 'ENROLLMENT' && teaDims.length > 0)

    if (!needsTrackedEntityType) {
        return { trackedEntityType: undefined, attributeDimensions }
    }

    const tetId = layoutDims.find(
        (dim) => dim.trackedEntityTypeId
    )?.trackedEntityTypeId
    if (!tetId) {
        throw new Error(
            `Cannot resolve trackedEntityType for outputType=${outputType}: no layout dimension carries a trackedEntityTypeId`
        )
    }
    const tet = metadataStore.getMetadataItem(tetId)
    if (!tet) {
        throw new Error(
            `Tracked entity type "${tetId}" referenced by a layout dimension but not found in the metadata store`
        )
    }
    return {
        trackedEntityType: { id: tet.id, name: tet.name },
        attributeDimensions,
    }
}
