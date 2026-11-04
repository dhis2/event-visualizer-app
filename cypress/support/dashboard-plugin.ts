/* Same-origin iframe, so its document is reachable; wait for a non-empty body
 * so we don't query before it has booted. */
export const pluginBody = (): Cypress.Chainable<JQuery<HTMLElement>> =>
    cy
        .get('[data-test="plugin-host-iframe-wrap"] iframe')
        .its('0.contentDocument.body')
        .should('not.be.empty')
        .then((body) => cy.wrap(body as HTMLElement))
