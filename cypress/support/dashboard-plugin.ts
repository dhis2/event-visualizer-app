/* The plugin renders inside an iframe served from the same origin, so its
 * document is reachable. Waiting for a non-empty body avoids querying the
 * iframe before it has booted. */
export const pluginBody = () =>
    cy
        .get('[data-test="plugin-host-iframe-wrap"] iframe')
        .its('0.contentDocument.body')
        .should('not.be.empty')
        .then(cy.wrap)
