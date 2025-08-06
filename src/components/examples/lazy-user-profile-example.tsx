import type { MeDto, PickWithFieldFilters } from '@types'
import React from 'react'
import { useRtkLazyQuery } from '../../hooks'

const fieldsFilter = ['id', 'name', 'email', 'settings'] as const

type CurrentUserData = PickWithFieldFilters<MeDto, typeof fieldsFilter>

export const LazyUserProfileExample = () => {
    const [trigger, { data, error, isError, isLoading, isUninitialized }] =
        useRtkLazyQuery<CurrentUserData>()

    if (isUninitialized) {
        return (
            <button
                onClick={() =>
                    trigger({
                        resource: 'me',
                        params: { fields: [...fieldsFilter] },
                    })
                }
                disabled={isLoading}
            >
                Load User Profile
            </button>
        )
    }

    if (isLoading) {
        return <div>Loading user profile...</div>
    }

    if (isError) {
        return <div>Error loading profile: {error.message}</div>
    }

    return <div>Welcome, {data.name}!</div>
}
