/// <reference types="cypress" />
import '@dhis2/cypress-commands'

Cypress.Commands.add('getByDataTest', (selector, ...args) =>
    cy.get(`[data-test=${selector}]`, ...args)
)

Cypress.Commands.add('getByDataTestLike', (selector, ...args) =>
    cy.get(`[data-test*=${selector}]`, ...args)
)

Cypress.Commands.add(
    'findByDataTest',
    {
        prevSubject: true,
    },
    (subject, selector, ...args) =>
        cy.wrap(subject).find(`[data-test=${selector}]`, ...args)
)

Cypress.Commands.add(
    'findByDataTestLike',
    {
        prevSubject: true,
    },
    (subject, selector, ...args) =>
        cy.wrap(subject).find(`[data-test*=${selector}]`, ...args)
)

Cypress.Commands.add(
    'containsExact',
    {
        prevSubject: true,
    },
    (subject, selector) =>
        cy.wrap(subject).contains(
            new RegExp(
                `^${selector.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, //eslint-disable-line no-useless-escape
                'gm'
            )
        )
)

type LoginOptions = {
    username: string
    password: string
    baseUrl: string
}
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Custom command to select DOM element by data-test attribute.
             * @example cy.getByDataTest('menu-list-item')
             */
            getByDataTest(value: string): Chainable<JQuery<HTMLElement>>

            /**
             * Custom command to select DOM element by partial match on data-test attribute.
             * @example cy.getByDataTestLike('menu-list-item')
             */
            getByDataTestLike(value: string): Chainable<JQuery<HTMLElement>>

            /**
             * Custom command to filter matching descendent DOM elements by data-test attribute.
             * @example cy.findByDataTest('menu-list-item')
             */
            findByDataTest(value: string): Chainable<JQuery<HTMLElement>>

            /**
             * Custom command to filter matching descendent DOM elements by partial match on data-test attribute.
             * @example cy.findByDataTestLike('menu-list-item')
             */
            findByDataTestLike(value: string): Chainable<JQuery<HTMLElement>>

            /**
             * Custom command to select DOM element which contains the exact text (case sensitive).
             * @example cy.containsExact('Hello there John')
             */
            containsExact(value: string): Chainable<JQuery<HTMLElement>>

            /**
             * Custom command to login to the DHIS2 Core backend
             * @example cy.loginByApi({ username: 'john', password: 'pw', baseUrl: 'http://localhost:8080' })
             */
            loginByApi(options: LoginOptions): Chainable<Response<string>>
        }
    }
}
