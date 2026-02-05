import { api } from '@api/api'
import type { BaseQueryApiWithExtraArg } from '@api/custom-base-query'
import { parseEngineError } from '@api/parse-engine-error'
import { getDimensionIdParts } from '@modules/dimension'
import type { DimensionType, LegendSetMetadataItem } from '@types'

type GetLegendSetsByDimensionQueryArgs = {
    dimensionType: DimensionType
    dimensionId: string
}

export const legendSetsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getLegendSet: builder.query<LegendSetMetadataItem, string>({
            async queryFn(id, apiArg: BaseQueryApiWithExtraArg) {
                const { appCachedData, engine, metadataStore } = apiArg.extra

                const nameProp =
                    appCachedData.currentUser.settings.displayNameProperty

                try {
                    const legendSetsResponse = await engine.query({
                        legendSet: {
                            resource: 'legendSets',
                            id,
                            params: {
                                fields: [
                                    'id',
                                    `${nameProp}~rename(name)`,
                                    `legends[id,${nameProp}~rename(name),startValue,endValue]`,
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
                const { appCachedData, engine } = apiArg.extra
                const nameProp =
                    appCachedData.currentUser.settings.displayNameProperty

                let query

                const { dimensionId: id } = getDimensionIdParts({
                    id: dimensionId,
                })

                try {
                    switch (dimensionType) {
                        case 'DATA_ELEMENT':
                            query = {
                                resource: 'dataElements',
                                id,
                                params: {
                                    fields: `legendSets[id,${nameProp}~rename(name)]`,
                                },
                            }
                            break
                        case 'PROGRAM_ATTRIBUTE':
                            query = {
                                resource: 'trackedEntityAttributes',
                                id,
                                params: {
                                    fields: `legendSets[id,${nameProp}~rename(name)]`,
                                },
                            }
                            break
                        case 'PROGRAM_INDICATOR':
                            query = {
                                resource: 'programIndicators',
                                id,
                                params: {
                                    fields: `legendSets[id,${nameProp}~rename(name)]`,
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
