import { dimensionCreate } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { getDimensionIdParts } from '@modules/dimension'
import { parseUiRepetitions } from '@modules/repetitions'
import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import type { Axis, Layout, MetadataStore, Program } from '@types'

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

export const formatLayoutForVisualization = (visUiConfig: VisUiConfigState) =>
    Object.entries(visUiConfig.layout).reduce(
        (layout, [axisId, dimensionIds]: [string, string[]]) => ({
            ...layout,
            [axisId]: dimensionIds
                .map((id) => {
                    const { programId, programStageId, dimensionId } =
                        getDimensionIdParts({
                            id,
                            outputType: visUiConfig.outputType,
                        })

                    return dimensionCreate(
                        dimensionId,
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

export const formatProgramDimensionsForVisualization = (
    visUiConfig: VisUiConfigState,
    metadataStore: MetadataStore
) =>
    Object.values(visUiConfig.layout)
        .flat()
        .reduce<Program[]>((programDimensions, dimensionId) => {
            const programId =
                metadataStore.getDimensionMetadataItem(dimensionId)?.programId

            if (programId) {
                const programMetadata =
                    metadataStore.getProgramMetadataItem(programId)

                if (programMetadata) {
                    programDimensions.push(programMetadata)
                }
            }

            return programDimensions
        }, [])
