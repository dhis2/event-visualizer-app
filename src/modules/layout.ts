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
    DimensionMetadataItem,
    Layout,
    MetadataStore,
    OutputType,
    Program,
} from '@types'

type TeiFields = Pick<
    CurrentVisualization,
    'trackedEntityType' | 'attributeDimensions'
>

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

type DimensionLookup = (compoundId: string) => DimensionMetadataItem | undefined

const buildAttributeDimensions = (
    layoutDims: DimensionMetadataItem[]
): NonNullable<CurrentVisualization['attributeDimensions']> =>
    layoutDims
        .filter((dim) => dim.dimensionType === 'PROGRAM_ATTRIBUTE')
        .map((dim) => ({
            attribute: { id: dim.dimensionId, name: dim.name },
        }))

const resolveTrackedEntityType = (
    outputType: OutputType,
    layoutDims: DimensionMetadataItem[],
    metadataStore: MetadataStore
): { id: string; name: string } | undefined => {
    if (outputType === 'EVENT') {
        return undefined
    }
    const hasTea = layoutDims.some(
        (dim) => dim.dimensionType === 'PROGRAM_ATTRIBUTE'
    )
    if (outputType === 'ENROLLMENT' && !hasTea) {
        return undefined
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
    return { id: tet.id, name: tet.name }
}

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

export const buildTeiFieldsFromLayout = (
    visUiConfig: VisUiConfigState,
    metadataStore: MetadataStore
): TeiFields => {
    const layoutDims = getLayoutDims(visUiConfig, metadataStore)
    const result: TeiFields = {}

    const attributeDimensions = buildAttributeDimensions(layoutDims)
    if (attributeDimensions.length > 0) {
        result.attributeDimensions = attributeDimensions
    }

    const trackedEntityType = resolveTrackedEntityType(
        visUiConfig.outputType,
        layoutDims,
        metadataStore
    )
    if (trackedEntityType) {
        result.trackedEntityType = trackedEntityType
    }

    return result
}

export const formatProgramDimensionsForVisualization = (
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

export const formatLayoutForVisualization = (
    visUiConfig: VisUiConfigState,
    getDimension: DimensionLookup
) =>
    Object.entries(visUiConfig.layout).reduce(
        (layout, [axisId, dimensionIds]: [string, string[]]) => ({
            ...layout,
            [axisId]: dimensionIds
                .map((id) => {
                    const dim = getDimension(id)
                    if (!dim) {
                        throw new Error(
                            `No metadata found for dimension "${id}" — cannot decompose compound ID for API`
                        )
                    }
                    const dimensionId = dim.dimensionId ?? id
                    const programId = dim.programId
                    const programStageId = dim.programStageId

                    return dimensionCreate(
                        toApiDimensionId(dimensionId),
                        visUiConfig.itemsByDimension[id],
                        {
                            filter: visUiConfig.conditionsByDimension[id]
                                ?.condition,
                            ...(visUiConfig.conditionsByDimension[id]
                                ?.legendSet && {
                                legendSet: {
                                    id: visUiConfig.conditionsByDimension[id]
                                        .legendSet,
                                },
                            }),
                            ...(visUiConfig.repetitionsByDimension[id] && {
                                repetition: {
                                    indexes: parseUiRepetitions(
                                        visUiConfig.repetitionsByDimension[id]
                                    ),
                                },
                            }),
                            ...(programId && {
                                program: {
                                    id: programId,
                                },
                            }),
                            ...(programStageId && {
                                programStage: {
                                    id: programStageId,
                                },
                            }),
                        }
                    )
                })
                .filter((dim) => dim !== null),
        }),
        {}
    )
