import { api } from '@api/api'
import type { BaseQueryApiWithExtraArg } from '@api/custom-base-query'
import { parseEngineError } from '@api/parse-engine-error'
import type {
    EventVisualizationType,
    FavoriteStatistics,
    SavedVisualization,
} from '@types'

type EventVisualizationRecord = Partial<SavedVisualization> &
    Required<Pick<SavedVisualization, 'id' | 'type'>>
type FavoriteRecord = FavoriteStatistics &
    Required<Pick<FavoriteStatistics, 'id' | 'name'>>
type MostViewedRecord = FavoriteRecord & {
    type: EventVisualizationType
}

export const dataStatisticsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getMostViewed: builder.query<MostViewedRecord[], void>({
            async queryFn(_args, apiArg: BaseQueryApiWithExtraArg) {
                const { appCachedData, engine } = apiArg.extra

                const username = appCachedData.currentUser.username

                try {
                    const mostViewedData: MostViewedRecord[] = []

                    const favoritesResponse = await engine.query({
                        favorites: {
                            resource: 'dataStatistics/favorites',
                            params: {
                                eventType: 'EVENT_VISUALIZATION_VIEW',
                                pageSize: 6,
                                ...(username ? { username } : {}),
                            },
                        },
                    })

                    const favorites =
                        favoritesResponse.favorites as FavoriteRecord[]

                    if (favorites.length > 0) {
                        const {
                            eventVisualizations: { eventVisualizations },
                        } = (await engine.query({
                            eventVisualizations: {
                                resource: 'eventVisualizations',
                                params: {
                                    fields: 'id,type',
                                    filter: `id:in:[${favorites.map(
                                        ({ id }) => id
                                    )}]`,
                                },
                            },
                        })) as {
                            eventVisualizations: {
                                eventVisualizations: EventVisualizationRecord[]
                            }
                        }

                        for (const favorite of favorites) {
                            const type = eventVisualizations.find(
                                (vis) => vis.id === favorite.id
                            )?.type

                            if (type) {
                                mostViewedData.push({
                                    id: favorite.id,
                                    name: favorite.name,
                                    type,
                                })
                            }
                        }
                    }

                    return { data: mostViewedData }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),
    }),
})
