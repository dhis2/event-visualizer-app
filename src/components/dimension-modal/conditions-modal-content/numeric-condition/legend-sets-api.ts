import { api } from '@api/api'
import type { BaseQueryApiWithExtraArg } from '@api/custom-base-query'
import { parseEngineError } from '@api/parse-engine-error'
import { extractPlainDimensionId } from '@modules/dimension'
import type { DimensionType, LegendSetMetadataItem } from '@types'

type GetLegendSetsByDimensionQueryArgs = {
    dimensionType: DimensionType
    dimensionId: string
}

export const legendSetsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getLegendSet: builder.query<LegendSetMetadataItem, string>({
            async queryFn(id, apiArg: BaseQueryApiWithExtraArg) {
                const { engine, metadataStore } = apiArg.extra

                try {
                    const legendSetsResponse = await engine.query({
                        legendSet: {
                            resource: 'legendSets',
                            id,
                            params: {
                                // legend sets and legends have no shortName, so the name always comes from displayName
                                fields: [
                                    'id',
                                    'displayName~rename(name)',
                                    'legends[id,displayName~rename(name),startValue,endValue]',
                                ],
                                paging: 'false',
                            },
                        },
                    })

                    const legendSet =
                        legendSetsResponse.legendSet as LegendSetMetadataItem

                    metadataStore.addMetadata(legendSet)

                    return { data: legendSet }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),

        getLegendSetsByDimension: builder.query<
            LegendSetMetadataItem[],
            GetLegendSetsByDimensionQueryArgs
        >({
            async queryFn(
                { dimensionType, dimensionId },
                apiArg: BaseQueryApiWithExtraArg
            ) {
                const { engine, metadataStore } = apiArg.extra

                let query

                const id =
                    metadataStore.getDimensionMetadataItem(dimensionId)
                        ?.dimensionId ?? extractPlainDimensionId(dimensionId)

                // legend sets have no shortName, so the name always comes from displayName
                try {
                    switch (dimensionType) {
                        case 'DATA_ELEMENT':
                            query = {
                                resource: 'dataElements',
                                id,
                                params: {
                                    fields: `legendSets[id,displayName~rename(name)]`,
                                },
                            }
                            break
                        case 'PROGRAM_ATTRIBUTE':
                            query = {
                                resource: 'trackedEntityAttributes',
                                id,
                                params: {
                                    fields: `legendSets[id,displayName~rename(name)]`,
                                },
                            }
                            break
                        case 'PROGRAM_INDICATOR':
                            query = {
                                resource: 'programIndicators',
                                id,
                                params: {
                                    fields: `legendSets[id,displayName~rename(name)]`,
                                },
                            }
                            break
                        default:
                            throw new Error(
                                `${dimensionType} is not a valid dimension type`
                            )
                    }

                    const legendSetsResponse = (await engine.query({
                        legendSets: query,
                    })) as {
                        legendSets?: { legendSets: LegendSetMetadataItem[] }
                    }

                    return {
                        data: legendSetsResponse?.legendSets
                            ?.legendSets as LegendSetMetadataItem[],
                    }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),
    }),
})
