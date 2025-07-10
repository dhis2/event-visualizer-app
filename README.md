# Event visualizer app and plugin

This project was bootstrapped with [DHIS2 Application Platform](https://github.com/dhis2/app-platform).

## Available Scripts

In the project directory, you can run:

### `yarn install`

This will install the required dependencies and on the first `postinstall` it will do the following:

1. Generate TypesScript types from the DHIS2 Core OpenAPI specs and store them in `./types/dhis2-openapi-schemas/`
2. Install Husky hooks to run on `pre-commit`, `pre-push` and `commit-msg`
3. Copy `cypress.env.template.json` to `cypress.env.json` so that the Cypress E2E suite can run successfully

### `yarn start`

Runs the app in the development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits. You will also see any lint errors in the console.

### `yarn test`

Launches the test runner and runs all available unit tests found in `/src` using vitest. Using `yarn test:watch` will run the tests in watch mode.

### `yarn build`

Builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include hashes. A deployable `.zip` file can be found in `build/bundle`.

See the section about [building](https://platform.dhis2.nu/#/scripts/build) for more information.

### `yarn deploy`

Deploys the built app in the `build` folder to a running DHIS2 instance. This command will prompt you to enter a server URL as well as the username and password of a DHIS2 user with the App Management authority.

You must run `yarn build` before running `yarn deploy`.

See the section about [deploying](https://platform.dhis2.nu/#/scripts/deploy) for more information.

### `yarn lint` / `yarn format`

These commands use `d2-style` to lint the code, but `yarn format` also attempts to fix/format the violations it finds.

### `yarn cy:open` / `yarn cy:run`

Run the Cypress E2E test suite, either in the Cypress GUI or in the terminal.

### `yarn generate-types`

Will (re)generate the TypesScript types from the DHIS2 Core OpenAPI schemas.

## Contribution Guide

All changes to the app are done via PRs which need to be approved by a member of Team Analytics. All new features require decent test coverage, using a suitable combination of unit and e2e tests. When working on the app, please keep the guidelines below in mind.

### Getting Started

Before making your first contribution, please:

1. **Set up your development environment** by running `yarn install` (this will also run the `postinstall` script)
2. **Run the tests** with `yarn test` to ensure everything is working
3. **Start the development server** with `yarn start` to familiarize yourself with the app
4. **Read through the architectural guidelines** below to understand the codebase structure

### Development Workflow

1. **Create a feature branch** from `main`
2. **Make your changes** following the guidelines below
3. **Write or update tests** to maintain good test coverage
4. **Run linting and formatting** with `yarn lint` and `yarn format`
5. **Test your changes** with both unit tests (`yarn test`) and e2e tests (`yarn cy:run`)
6. **Create a pull request** for Team Analytics review

### Code Organisation

You should organize your code by feature and not by filetype.

### TypeScript Types

This project uses TypeScript extensively. Understanding our type organization is crucial for effective development. When working with types, you'll encounter several distinct categories:

1. **Generated types**: We have a script that runs automatically on postinstall and can be triggered manually, which generates a vast amount of types from the DHIS2 Core OpenAPI Specs. These are not under source control and you should not import them directly (this is enforced via an ESLint rule). Instead, you should import them into the app-global file, which gives you the opportunity to override some types with handcrafted type definitions.
2. **App-global types**: Types that are likely to be used all over the app and/or not specific to a feature should be created or re-exported from here. In the `tsconfig.json` we have added a "path" with the name `@types` to this file. This means you can use `import type { SomeType } from '@types'`, which is quite ergonomic since you don't have to think about directory traversal. Note that this is TypeScript-only feature at the moment, so it only works for type imports using the `import type ..` syntax.
3. **Feature-specific types**: Often you will be creating types that are specific to a particular feature, so they are only used by one or several colocated files. You don't need to re-export these from the App-global types, just keep them local.
4. **Analytics types**: These are present at the time of writing but should get removed at a later date. Since the Analytics library is written in JavaScript and no type definitions are available, and because the event-analytics-app is the first TypeScript app for Team Analytics, we add type definitions for the Analytics library here in `src/types/analytics`. Once more projects start using TypeScript, or whenever we have a complete type definition for the Analytics library, we will move the types over to `@dhis2/analytics`.

### State Management

Global app state is managed by Redux, using Redux Toolkit. You should typically create state "slices" using the `createSlice` API which is the approach recommended by Redux Toolkit. You should then export slice reducers and add them to the store, as demonstrated in the Redux Toolkit [quick start example](https://redux-toolkit.js.org/tutorials/quick-start).

When accessing the store and dispatching actions, you would normally use the `useSelector` and `useDispatch` hooks. However, since this is a TypeScript project, you should use the analogue `useAppSelector` and `useAppDispatch` hooks from `/src/hooks`. These are essentially the same hooks but with the types of our app's store as explained [here](https://redux-toolkit.js.org/tutorials/typescript#define-typed-hooks). To ensure you use these hooks consistently, we enforce this via an ESLint restricted-imports rule to prevent importing the hooks from `@reduxjs/toolkit`.

### Interaction with the DHIS2 Core Web API

Redux Toolkit comes with a tool for data queries and mutations called RTK Query. We have integrated this tool with the DHIS2 Data Engine from `@dhis2/app-service-data` as follows:

-   The `engine` (Data Engine) is added to `thunk.extraArgument` when creating the store
-   A [custom base query](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#customizing-queries-with-basequery) has been implemented that calls `engine.query` or `engine.mutate`.
-   Two generic endpoints have been added to the api that represent a generic api query or mutation.

You can interact with these generic endpoints using the `useRtkQuery` and `useRtkMutation` (and `useRtkLazyQuery`) hooks, exported from `/src/hooks`. In the app you should typically use these hooks to interact with the DHIS2 Core Web API, and you should NEVER use `useDataQuery` or `useDataMutation` (we have ESLint rules in place to prevent these imports). The `useRtkQuery` and `useRtkMutation` hooks are very similar to the hooks from `@dhis/app-service-data`, there are only a few minor differences:

-   The hooks from `@dhis/app-service-data` accept a second positional `options` (object) argument, while the hooks from RTK Query do not. However for [each options-field](https://developers.dhis2.org/docs/app-runtime/hooks/usedataquery/) a probably more ergonomical alternative exists:
    -   Because `useRtkQuery` and `useRtkMutation` accept dynamically constructed query/mutation objects the `variables` field is redundant (as well as the callback form of the `id` and `params` field of [the query](https://developers.dhis2.org/docs/app-runtime/types/Query))
    -   Instead of providing a `lazy` option, you can use the `useRtkLazyQuery` hook
    -   Instead of using the non-idiomatic `onSuccess` and/or `onError` callbacks, you can use the `useEffect` hooks to monitor the state transitions, or use the `trigger().unwrap()` function [returned from `useRtkLazyQuery`](https://redux-toolkit.js.org/rtk-query/api/created-api/hooks#uselazyquery-signature) and just deal with a regular promise and a try/catch block.
-   The `useDataQuery` hook from `@dhis/app-service-data` only accepts a "nested query definition" like this `{ me: { resource: 'me' } }`, but `useRtkQuery` also accepts a simple query object like this `{ resource: 'me' }`. This is an additional convenience for simple queries that also lets you access the response data in a more straightforward way, i.e. `data.name` instead of `data.me.name`.
-   The data returned from the hook is also slightly different, details can be read in the [Redux Toolkit Hooks docs](https://redux-toolkit.js.org/rtk-query/api/created-api/hooks).

Apart from using these generic `useRtkQuery`, `useRtkMutation` and `useRtkLazyQuery` hooks, you can also easily create custom endpoints that come with auto-generated hooks. You can do this by adding more endpoints in `/src/api/api.ts` or by using the `injectEndpoints` or `enhanceEndpoints` functions as [documented here](https://redux-toolkit.js.org/rtk-query/api/created-api/code-splitting). Each endpoint declares [its own `queryFn`](https://redux-toolkit.js.org/rtk-query/api/createApi#queryfn) where it can access the `engine`, metadata store, and app cached data via the `api.extra` argument. A custom endpoint can also specify its own data type, so consuming components do not have to declare it themselves.

In most cases, using the generic hooks is probably the best solution, but there are some cases that require or justify the creation of a new endpoint:

-   Analytics requests, because for these we want to create an analytics request instance in the function body.
-   Chained requests, where response data from request X is needed to initiate request Y
-   Requests to resources outside of the DHIS2 Web API scope (not on `${baseUrl}/api/${version}`)
-   Common requests, this is not required, but it makes sense to also generate a dedicated api-endpoint for requests that occur across multiple places in the codebase. By having a custom endpoint with a predefined type for the returned data, the consuming component does not have to declare a type, so this avoids repetition and prevents the same request from being triggered multiple times.
-   Paginated requests AKA [infinite queries](https://redux-toolkit.js.org/rtk-query/usage/infinite-queries) in Redux Toolkit lingo. Since pagination is handled in quite a standardized way across the web-api, it's wuite possible that we will end up adding a generic `paginatedQuery` endpoint for this.
-   Requests to the [Gist API](https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-master/metadata-gist.html), but as with paginated requests, it is quite possible that we end up creating a generic `gistQuery` endpoint for this.

#### Using `useRtkQuery`

```typescript
import type { MeDto, PickWithFieldFilters } from '@types'
import React from 'react'
import { useRtkQuery } from '../../hooks'

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
```

The example above uses a "simple query definition": the query is a simple object with a `resource` field. If you would like to request multiple resources in parallel it is also possible to provide a nested object, in the same shape as you would pass to `useDataQuery` from `@dhis2/app-service-data`, for example:

```typescript
// Declare a nested data type
type QueryData = {
    me: MeDto
    systemSettings: SystemSettings
}
// Pass it to the hook
const { data, isLoading, isError, error } = useRtkQuery<QueryData>({
    me: { resource: 'me' },
    systemSettings: { resource: 'systemSettings' },
})
// In the end you would be able to do
console.log(data.me.name, data.systemSettings.keyAccountExpiresInDays)
```

#### Using `useRtkLazyQuery`

This hook offers the same functionality as `useDataQuery` from `@dhis2/app-service-data`, but it works quite differently. Instead of passing the query arguments to the hook, you pass them to the `trigger` function returned from the hook.

```typescript
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
```

#### Using `useRtkMutation`

```typescript
import React, { useState, useCallback } from 'react'
import { useRtkMutation } from '../../hooks'

export const DashboardExample = () => {
    const [dashboardName, setDashboardName] = useState('')
    const [dashboardId, setDashboardId] = useState('')
    const [trigger, { data, error, isLoading, isSuccess, isError }] =
        useRtkMutation()

    // Handle input change
    const handleNameChange = useCallback((e) => {
        setDashboardName(e.target.value)
    }, [])

    // Create dashboard
    const handleCreate = useCallback(() => {
        trigger({
            resource: 'dashboards',
            type: 'create',
            data: { name: dashboardName },
        }).then((response) => {
            if (response.data?.response.uid) {
                setDashboardId(String(response.data.response.uid))
            }
        })
    }, [dashboardName, trigger])

    // Edit dashboard
    const handleEdit = useCallback(() => {
        trigger({
            resource: 'dashboards',
            type: 'update',
            id: dashboardId,
            data: { name: dashboardName },
        })
    }, [dashboardId, dashboardName, trigger])

    // Delete dashboard
    const handleDelete = useCallback(() => {
        trigger({
            resource: 'dashboards',
            type: 'delete',
            id: dashboardId,
        }).then(() => {
            setDashboardId('')
            setDashboardName('')
        })
    }, [dashboardId, trigger])

    return (
        <div>
            <input
                name="name"
                placeholder="Dashboard Name"
                value={dashboardName}
                onChange={handleNameChange}
                disabled={isLoading}
            />
            {!dashboardId ? (
                <button
                    onClick={handleCreate}
                    disabled={isLoading || !dashboardName}
                >
                    Create
                </button>
            ) : (
                <>
                    <button
                        onClick={handleEdit}
                        disabled={isLoading || !dashboardName}
                    >
                        Edit
                    </button>
                    <button onClick={handleDelete} disabled={isLoading}>
                        Delete
                    </button>
                </>
            )}
            <div>
                {isLoading && <p>Loading...</p>}
                {isSuccess && dashboardId && (
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                )}
                {isError && (
                    <p style={{ color: 'red' }}>{error?.message || 'Error'}</p>
                )}
            </div>
        </div>
    )
}
```

#### Using `injectEndpoints` for an analytics requests

```typescript
import type { MeDto } from '@types'
import React from 'react'
import { api } from '../../api/api'
import type { BaseQueryApiWithExtraArg } from '../../api/custom-base-query'
import { parseEngineError } from '../../api/parse-engine-error'

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

export const EndpointUserProfileExample: React.FC = () => {
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
```

### Testing Guidelines

When writing tests, please follow these guidelines:

-   **Place unit tests** next to the files they test (e.g., `component.test.tsx` next to `component.tsx`)
-   **Place E2E tests** in the `cypress/e2e/` directory
-   **Maintain test coverage** for new features - aim for meaningful tests rather than 100% coverage
-   **Mock external dependencies** appropriately in unit tests
-   **Use descriptive test names** that explain what behavior is being tested

### Code Quality

When writing code, please adhere to these standards:

-   **Follow existing patterns** in the codebase
-   **Use TypeScript strictly** - avoid `any` types
-   **Write meaningful commit messages** following conventional commit format
-   **Keep functions small and focused** - follow single responsibility principle
-   **Use semantic naming** for variables, functions, and components
-   **Document complex logic** with comments where necessary

## Learn More

You can learn more about the platform in the [DHIS2 Application Platform Documentation](https://platform.dhis2.nu/).

You can learn more about the runtime in the [DHIS2 Application Runtime Documentation](https://runtime.dhis2.nu/).

To learn React, check out the [React documentation](https://reactjs.org/).
