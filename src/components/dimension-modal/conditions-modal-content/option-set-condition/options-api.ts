import { api } from '@api/api'
import type { BaseQueryApiWithExtraArg } from '@api/custom-base-query'
import { parseEngineError } from '@api/parse-engine-error'

export type FetchOptionsByOptionSetQueryArgs = {
    id: string
    searchTerm?: string
    page: number
}

export type FetchResult = {
    items: { code: string; id: string; name: string }[]
    nextPage: number | null
}

export const optionsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        fetchOptionsByOptionSet: builder.query<
            FetchResult,
            FetchOptionsByOptionSetQueryArgs
        >({
            async queryFn(
                { id, searchTerm, page = 1 },
                apiArg: BaseQueryApiWithExtraArg
            ) {
                const { appCachedData, engine } = apiArg.extra

                const nameProp =
                    appCachedData.currentUser.settings.displayNameProperty

                const filters = [`optionSet.id:eq:${id}`]

                if (searchTerm) {
                    filters.push(`displayName:ilike:${searchTerm}`)
                }

                try {
                    const response = await engine.query({
                        options: {
                            resource: 'options',
                            params: {
                                fields: `code,${nameProp}~rename(name),id`,
                                filter: filters,
                                paging: true,
                                page,
                            },
                        },
                    })
                    const result = response?.options as {
                        options: FetchResult['items']
                        pager: {
                            page: number
                            pageCount: number
                            pageSize: number
                            total: number
                            nextPage?: string
                            prevPage?: string
                        }
                    }

                    return {
                        data: {
                            items: result.options,
                            nextPage: result.pager.nextPage
                                ? result.pager.page + 1
                                : null,
                        },
                    }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),
    }),
})
