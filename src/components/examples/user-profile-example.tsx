import React from 'react'
import { useRtkQuery } from '@hooks'
import type { MeDto, PickWithFieldFilters } from '@types'

const fieldsFilter = ['id', 'name', 'email', 'settings'] as const

type CurrentUserData = PickWithFieldFilters<MeDto, typeof fieldsFilter>

export const UserProfileExample = () => {
    const { data, isLoading, isError, error } = useRtkQuery<CurrentUserData>({
        resource: 'me',
        params: {
            fields: [...fieldsFilter],
        },
    })

    // The TS compiler would flag this up because data is possibly undefined here
    // console.log(data.name)

    if (isLoading) {
        // Both `error` and `data` will be undefined here
        console.log(data, error)
        return <div>Loading user profile...</div>
    }
    if (isError) {
        // `error` will be of type EngineError and `data` will is possibly undefined
        console.log(data, error)
        return <div>Error loading profile: {error.message}</div>
    }

    // No need to access data?.name the TS compiler knows that data is defined
    // because isError and isLoading are false
    return <div>Welcome, {data.name}!</div>
}
