import type { FC } from 'react'
import { api } from '@api/api'
import type { BaseQueryApiWithExtraArg } from '@api/custom-base-query'
import { parseEngineError } from '@api/parse-engine-error'
import type { MeDto } from '@types'

export const meApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getMe: builder.query<MeDto, void>({
            async queryFn(_args, apiArg: BaseQueryApiWithExtraArg) {
                const engine = apiArg.extra.engine
                try {
                    const data = await engine.query({ me: { resource: 'me' } })
                    const me = data.me as MeDto
                    return { data: me }
                } catch (error) {
                    return { error: parseEngineError(error) }
                }
            },
        }),
    }),
})

export const EndpointUserProfileExample: FC = () => {
    const { data, error, isLoading } = meApi.useGetMeQuery()

    if (isLoading) {
        return <div>loading</div>
    }
    if (error) {
        return <div>error</div>
    }
    if (data) {
        return <div>Welcome, {data.name}!</div>
    }
    return null
}
