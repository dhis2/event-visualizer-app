import type { MeDto, PickWithFieldFilters } from '@types'
import React from 'react'
import { useRtkQuery } from '../../hooks'

const fieldsFilter = ['id', 'name', 'email', 'settings'] as const

type MeWithRequiredNameAndId = Omit<MeDto, 'id' | 'name' | 'settings'> & {
    id: string
    name: string
    settings: {
        a: string
        b: string
    }
}

type CurrentUserData = PickWithFieldFilters<
    MeWithRequiredNameAndId,
    typeof fieldsFilter
>

export const UserProfileExample = () => {
    const result = useRtkQuery<CurrentUserData>({
        resource: 'me',
        params: {
            fields: [...fieldsFilter],
        },
    })

    console.log(result.data.name.length)

    if (result.isLoading) {
        console.log(result.data, result.error)
        return <div>Loading user profile...</div>
    }
    if (result.error) {
        console.log(result.data, result.error)
        return <div>Error loading profile: {result.error.message}</div>
    }

    return <div>Welcome, {result.data.name}!</div>
}
