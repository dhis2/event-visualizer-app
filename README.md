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

All changes to the app are done via PRs which need to be approved by a member of Team Analytics. All new features need decent test coverages, using a suitable combination of unit and e2e tests. When working on the app, please keep the guidelines below in mind.

### Code Organisation

Code is to be organised by feature and not by filetype.

### TypeScript Types

In this project we have several distinct categories of types:

1. **Generated types**: We have a script that runs automatically on postinstall and can be triggered manually, which generates a vast amount of types from the DHIS2 Core OpenAPI Specs. These are not under source control and should not be imported directly (this is enforced via an ESLint rule). Instead we import them into the app-global file, which gives us the opportunity to override some types with handcrafted type definitions.
2. **App-global types**: Types that are likely to be used all over the app and/or not specific to a feature should be created or re-exported from here. In the `tsconfig.json` we have added a "path" with the name `@types` to this file. This means you can use `import type { SomeType } from '@types'`, which is quite ergonomic since you don't have to think about directory traversal. Note that this is TypeScript-only feature at the moment, so it only works for type imports using the `import type ..` syntax.
3. **Feature-specific types**: Often you will be creating types that are specific to a particalur feature, so they are only used by one or sevaral colocated files. There is no need to re-export these from the App-global types, just keep them local.
4. **Analytics types**: These are present at the time of writing butn should get removed at a later date. Since the Analytics library is written in JavaScript and no type definitions are available, and because the event-analytics-app is the first TypeScript app for Team Analytics, we add type definitions for the Analytics library here in `src/types/analytics`. Once more projects start using TypeScript, or whenever we have a complete type definition for the Analytics library, we will move the types over to `@dhis2/analytics`.

### State Management

Global app state is managed by Redux, using Redux Toolkit. State "slices" should typically be created using the `createSlice` API which is the approach recommended by Redux Toolkit and slice reducers should then be exported and added to the store, as demonstrated in the Redux Toolkit [quick start example](https://redux-toolkit.js.org/tutorials/quick-start).

Accessing the store and disaptching actions happens throught the `useSelector` and `useDispatch` hooks, however since this is a TypeScript project we use the analogue `useAppSelector` and `useAppDispatch` hooks from `/src/hooks`. These are essentially the same hooks but with the types of our apps's store as explained [here](https://redux-toolkit.js.org/tutorials/typescript#define-typed-hooks). To ensure these hooks are used consistently is enforced by an ESLint restricted-imports rule to prevent importing the hooks from `@reduxjs/toolkit`.

### Interaction with the DHIS2 Core Web API

Redux Toolkit comes with a tool for data queries and mutations called RTK Query. We have intergrated this tool with the DHIS2 Data Engine from `@dhis2/app-service-data` as follows:

-   The `engine` (Data Engine) is added to `thunk.extraArgument` when creating the store
-   A [custom base query](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#customizing-queries-with-basequery) has been implemented that calls `engine.query` or `engine.mutate`.
-   Two generic endpoints have been added to the api that represent a generic api query or mutation.

These generic endpoints can be interacted with using the `useRtkQuery` and `useRtkMutation` (and `useRtkLazyQuery`) hooks, exported from `/src/hooks`. In the app we typically use these hooks to interact with the DHIS2 Core Web API, and we NEVER use `useDataQuery` or `useDataMutation` (and have ESlint rules in place to prevent these imports). The `useRtkQuery` and `useRtkMutation` hooks are very similar to the hooks from `@dhis/app-service-data`, there are only a few minor differences:

-   The hooks from `@dhis/app-service-data` accept a second positional `options` (object) argument, while the hooks from RTK Query do not. However for [each options-field](https://developers.dhis2.org/docs/app-runtime/hooks/usedataquery/) a probably more ergnomical alternative exists:
    -   Because `useRtkQuery` and `useRtkMutation` accept dynamically constructed query/mutation objects the `variables` field is redundant (as well as the callback form of the `id` and `params` field of [the query](https://developers.dhis2.org/docs/app-runtime/types/Query))
    -   Instead of providing a `lazy` option, there is the `useRtkLazyQuery` hook
    -   Instead of using the non-idomatic `onSuccess` and/or `onError` callbacks, you can use the `useEfect` hooks to monitor the state transitions, or use the `trigger().unwrap()` function [returned from `useRtkLazyQuery`](https://redux-toolkit.js.org/rtk-query/api/created-api/hooks#uselazyquery-signature) and just deal with a regular promise and a try/catch block.
-   The `useDataQuery` hook from `@dhis/app-service-data` only accepts a "nested query definition" like this `{ me: { resource: 'me' } }`, but `useRtkQuery` also accepts a simple query object like this `{ resource: 'me' }`. This is an additional convenience for simple queries that also lets you access the response data in a more straightfoward way, i.e. `data.name` instead of `data.me.name`.
-   The data returned from the hook is also slightly different, details can be read in the [Redux Toolkit Hooks docs](https://redux-toolkit.js.org/rtk-query/api/created-api/hooks).

Apart from using these generic `useRtkQuery`, `useRtkMutation` and `useRtkLazyQuery` hooks, it is also possible to easily create custom endpoints that come with auto-generated hooks. This can be done by adding more endpoints in `/src/api/api.ts` or by using the `injectEndpoints` or `enhanceEndpoints` functions as [documented here](https://redux-toolkit.js.org/rtk-query/api/created-api/code-splitting). Each enpoint declares [its own `queryFn`](https://redux-toolkit.js.org/rtk-query/api/createApi#queryfn) where it can access the `engine`, metadata store, and app cached data via the `api.extra` argument. A custom endpoint can also specify its own data type, so consuming components do not have to declare it themselves.

In most cases, using the generic hooks is probably the best solution, but there are some cases that require of justify the creation of a new endpoint:

-   Analytics requests, because for these we want to create an analytics request instance in the function body.
-   Chained requests, where response data from request X is needed to initiate request Y
-   Requests to resources outside of the DHIS2 Web API scope (not on `${baseUrl}/api/${version}`)
-   Common requests, this is not required, but it makes sense to also generate a dedicated api-endpoint for requests that occur across multiple places in the codebase. By having a custom endpoint with a predefined type for the returned data, the consuming component does not have to declare a type, so this avoids repetition.

## Learn More

You can learn more about the platform in the [DHIS2 Application Platform Documentation](https://platform.dhis2.nu/).

You can learn more about the runtime in the [DHIS2 Application Runtime Documentation](https://runtime.dhis2.nu/).

To learn React, check out the [React documentation](https://reactjs.org/).
