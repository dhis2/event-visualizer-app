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
    const { data, isLoading, error } = useRtkQuery({
        resource: 'me',
        params: {
            fields: [...fieldsFilter],
        },
    })

    if (isLoading) {
        return <div>Loading user profile...</div>
    }
    if (error) {
        return <div>Error loading profile: {error.message}</div>
    }

    const resolvedData = data as CurrentUserData

    return <div>Welcome, {resolvedData.name}!</div>
}
