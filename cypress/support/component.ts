// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import 'cypress-real-events'
import './commands'

// Import fonts
import 'typeface-roboto/index.css'

import { mount } from 'cypress/react'

Cypress.Commands.add('mount', mount)

// Example use:
// cy.mount(<MyComponent />)
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
    namespace Cypress {
        interface Chainable {
            mount: typeof mount
        }
    }
}
/* eslint-enable @typescript-eslint/no-namespace */

/* `@dhis2-ui/select` debounces its window-resize handler by 50ms but only
 * removes the listener on unmount, without cancelling a pending call. A resize
 * landing just before teardown — which Cypress does between tests — fires the
 * timer against a null ref and throws. Any spec mounting a Select, directly or
 * through Pagination, can fail on it at random. */
const isSelectResizeAfterUnmount = (error: Error): boolean =>
    error.message.includes("'offsetWidth'") &&
    error.message.includes('this.inputRef.current')

Cypress.on('uncaught:exception', (error) =>
    isSelectResizeAfterUnmount(error) ? false : undefined
)
