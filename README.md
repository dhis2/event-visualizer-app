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

Redux Toolkit comes with a powerful data fetching and caching tool called RTK Query. In this app, RTK Query is integrated with the DHIS2 Data Engine from `@dhis2/app-service-data` as follows:

-   The `engine` (Data Engine) is injected into `thunk.extraArgument` when creating the Redux store.
-   A [custom base query](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#customizing-queries-with-basequery) is implemented to call `engine.query` or `engine.mutate`.
-   Two generic endpoints are added to the API for generic queries and mutations.

You should interact with the DHIS2 Core Web API using the `useRtkQuery`, `useRtkMutation`, and `useRtkLazyQuery` hooks exported from `/src/hooks`. **Do not use** `useDataQuery` or `useDataMutation` from `@dhis2/app-service-data` directly—this is enforced by ESLint rules.

The `useRtkQuery` and `useRtkMutation` hooks are similar to those from `@dhis2/app-service-data`, with a few key differences:

-   The hooks from `@dhis2/app-service-data` accept a second positional `options` object, while the RTK Query hooks do not. However, for each options field, there is usually a more ergonomic alternative in RTK Query:
    -   Since `useRtkQuery` and `useRtkMutation` accept dynamically constructed query/mutation objects, the `variables` field is redundant (as are the callback forms of the `id` and `params` fields).
    -   To perform a lazy query, use the `useRtkLazyQuery` hook.
    -   Instead of `onSuccess`/`onError` callbacks, use `useEffect` to monitor state transitions, or use the `trigger().unwrap()` function returned from `useRtkLazyQuery` for promise-based handling.
-   The `useDataQuery` hook only accepts a nested query definition (e.g., `{ me: { resource: 'me' } }`), but `useRtkQuery` also accepts a simple query object (e.g., `{ resource: 'me' }`). This makes accessing response data more straightforward (e.g., `data.name` instead of `data.me.name`).
-   The data returned from the hook is slightly different; see the [Redux Toolkit Hooks docs](https://redux-toolkit.js.org/rtk-query/api/created-api/hooks) for details.

#### Custom Endpoints

While the generic hooks are suitable for most use cases, you can also create custom endpoints with auto-generated hooks by adding endpoints in `/src/api/api.ts` or using the `injectEndpoints` or `enhanceEndpoints` functions as [documented here](https://redux-toolkit.js.org/rtk-query/api/created-api/code-splitting). Each custom endpoint can declare its own `queryFn`, where it can access the `engine`, metadata store, and app cached data via the `api.extra` argument. Custom endpoints can also specify their own data types, so consuming components do not have to declare them.

**When to create a custom endpoint:**

-   Analytics requests, where you want to create an analytics request instance in the function body.
-   Chained requests, where the response from one request is needed to initiate another.
-   Requests to resources outside the DHIS2 Web API scope (not on `${baseUrl}/api/${version}`).
-   Common requests that occur in multiple places in the codebase, to avoid repetition and prevent duplicate requests.
-   Paginated requests (infinite queries), which may benefit from a dedicated endpoint.
-   Requests to the [Gist API](https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-master/metadata-gist.html).

#### Using `useRtkQuery`

<details>
<summary>Show code</summary>

```typescript
import type { MeDto, PickWithFieldFilters } from '@types'
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

</details>

The example above uses a "simple query definition": the query is a simple object with a `resource` field. If you would like to request multiple resources in parallel it is also possible to provide a nested object, in the same shape as you would pass to `useDataQuery` from `@dhis2/app-service-data`, for example:

<details>
<summary>Show code</summary>

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

</details>

#### Using `useRtkLazyQuery`

This hook offers the same functionality as `useDataQuery` from `@dhis2/app-service-data`, but it works quite differently. Instead of passing the query arguments to the hook, you pass them to the `trigger` function returned from the hook.

<details>
<summary>Show code</summary>

```typescript
import type { MeDto, PickWithFieldFilters } from '@types'
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

</details>

#### Using `useRtkMutation`

The `useRtkMutation` is a bit more flexible than the `useDataMutation` hook from `@dhis2/app-service-data`. Because you simply pass the arguments to the returned `trigger` (AKA as `mutate`), you can in theory reuse the same hook instance for various mutations.

<details>
<summary>Show code</summary>

```typescript
import { useState, useCallback } from 'react'
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

</details>

#### Using `injectEndpoints` for an analytics requests

<details>
<summary>Show code</summary>

```typescript
import type { MeDto } from '@types'
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

</details>

### Working with Metadata

In some other Analytics apps, metadata is stored in the Redux store, but this can be problematic: frequent updates to metadata often cause unnecessary re-renders. In this app, metadata is kept separate in a custom store implemented using a React Context Provider and the `useSyncExternalStore` hook. The store and its hooks are heavily optimized to only register relevant changes. Before updating an item, a deep-equality check is performed, and the hooks are designed to trigger a re-render only if a subscribed metadata item actually changes.

The app is wrapped in the `MetadataProvider`, which manages an instance of the metadata store. You have several hooks available to interact with it:

-   `useMetadataItem`: Access a single metadata item; triggers a re-render if that item is updated.
-   `useMetadataItems`: Access multiple metadata items; triggers a re-render if any of these items are updated.
-   `useAddMetadata`: Returns a stable function to add metadata to the store (will never cause a re-render).
-   `useMetadataStore`: Returns a stable reference to the store, providing access to `getMetadataItem`, `getMetadataItems`, and `addMetadata`. Use `getMetadataItem` for reading metadata during iteration, but note that these items will not update automatically. If you are rendering a list with metadata that could change while the list is "statically" displayed, do not use this hook. Instead, extract each list item into a component and use `useMetadataItem` in each component.

Function signatures and return types can be found in `src/app-wrapper/metadata-provider.tsx`, or will become apparent when you use the hooks.

In addition to being available via hooks, you can also access the metadata store in RTK Query endpoint query functions via `api.extra.metadataStore`. This object is populated by the return value of `useMetadataStore`.

### App Cached Data

The outermost component of the `AppWrapper` is the `AppCachedDataQueryProvider`. This fetches data considered static for the app's lifecycle. This data is guaranteed to be available before the app loads and can be accessed via the `useAppCachedDataQuery` hook. You can also directly access individual cached data properties using these hooks:

-   `useCurrentUser`
-   `useSystemSettings`
-   `useRootOrgUnits`
-   `useOrgUnitLevels`

### Browser Navigation

The `AppWrapper` contains a `StoreToLocationSyncer` component that keeps the `navigation` slice in the Redux store in sync with the browser URL. This synchronization is bidirectional:

-   When a user navigates using the browser's back/forward buttons or address bar, the `navigation` state is updated.
-   When the `navigation` state is updated, the browser's address bar and history stack are updated accordingly.

A few conventions to note:

-   `visualizationId` will always be populated in the store; the value `new` signifies that no saved AO is selected.
-   A blank URL `/` and `/new` are treated equally, so accessing the app at `#/` will not redirect to `#/new`.
