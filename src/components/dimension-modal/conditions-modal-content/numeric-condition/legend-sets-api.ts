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
                const { appCachedData, engine, metadataStore } = apiArg.extra
                const nameProp =
                    appCachedData.currentUser.settings.displayNameProperty

                const legendSetsFields = `legendSets[id,${nameProp}~rename(name),legends[id,${nameProp}~rename(name),startValue,endValue]]`

                let query

                const id =
                    metadataStore.getDimensionMetadataItem(dimensionId)
                        ?.dimensionId ?? extractPlainDimensionId(dimensionId)

                try {
                    switch (dimensionType) {
                        case 'DATA_ELEMENT':
                            query = {
                                resource: 'dataElements',
                                id,
                                params: { fields: legendSetsFields },
                            }
                            break
                        case 'PROGRAM_ATTRIBUTE':
                            query = {
                                resource: 'trackedEntityAttributes',
                                id,
                                params: { fields: legendSetsFields },
                            }
                            break
                        case 'PROGRAM_INDICATOR':
                            query = {
                                resource: 'programIndicators',
                                id,
                                params: { fields: legendSetsFields },
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

                    const legendSets = legendSetsResponse?.legendSets
                        ?.legendSets as LegendSetMetadataItem[]

                    /* Cache the sets in the metadata store so a grouped
                     * dimension's legend-set name resolves in the layout chip /
                     * tooltip. `legends: []` guards the rare set that returns no
                     * bands so it stays a valid legend set. */
                    if (Array.isArray(legendSets)) {
                        metadataStore.addMetadata(
                            legendSets.map((legendSet) => ({
                                ...legendSet,
                                legends: legendSet.legends ?? [],
                            }))
                        )
                    }

                    return { data: legendSets }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),
    }),
})
