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

## Learn More

You can learn more about the platform in the [DHIS2 Application Platform Documentation](https://platform.dhis2.nu/).

You can learn more about the runtime in the [DHIS2 Application Runtime Documentation](https://runtime.dhis2.nu/).

To learn React, check out the [React documentation](https://reactjs.org/).
