import { api } from '@api/api'
import type { BaseQueryApiWithExtraArg } from '@api/custom-base-query'
import { parseEngineError } from '@api/parse-engine-error'
import { apiFetchItemsByDimension } from '@dhis2/analytics'

export type FetchItemsByDimensionQueryArgs = {
    id: string
    searchTerm?: string
    page: number
}

export type FetchResult = {
    items: { id: string; name: string }[]
    nextPage: number | null
}

export const dimensionsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        fetchItemsByDimension: builder.query<
            FetchResult,
            FetchItemsByDimensionQueryArgs
        >({
            async queryFn(
                { id, searchTerm, page = 1 },
                apiArg: BaseQueryApiWithExtraArg
            ) {
                const { appCachedData, engine } = apiArg.extra

                try {
                    const result = await apiFetchItemsByDimension({
                        dataEngine: engine,
                        dimensionId: id,
                        searchTerm,
                        page,
                        nameProp:
                            appCachedData.currentUser.settings
                                .displayNameProperty,
                    })

                    return {
                        data: {
                            items: result.dimensionItems,
                            nextPage: result.nextPage,
                        },
                    }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),
    }),
})
