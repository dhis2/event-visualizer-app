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
