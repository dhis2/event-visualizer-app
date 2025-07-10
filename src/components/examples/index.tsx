import React, { FC } from 'react'
import { DashboardExample } from './dashboard-example'
import { EndpointUserProfileExample } from './endpoint-user-profile-example'
import { LazyUserProfileExample } from './lazy-user-profile-example'
import { UserProfileExample } from './user-profile-example'

export const Examples: FC = () => (
    <div>
        <h4>User Profile Example (useRtkQuery):</h4>
        <UserProfileExample />
        <hr />
        <h4>Lazy User Profile Example (useRtkLazyQuery):</h4>
        <LazyUserProfileExample />
        <hr />
        <h4>Dashboard Example (useRtkMutation):</h4>
        <DashboardExample />
        <hr />
        <h4>Endpoint User Profile Example (injectEndpoints):</h4>
        <EndpointUserProfileExample />
    </div>
)
