/* The app opens downloads with window.open, which Cypress can't follow. The
 * stub catches the URL, so the test can request it. */
export const stubWindowOpen = () =>
    cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen')
    })

export const downloadUrlFor = (menuPath: string[]) => {
    cy.get<sinon.SinonStub>('@windowOpen').invoke('resetHistory')
    /* A download from a submenu leaves the menu bar in a state where clicking
     * Download closes it. Escape always resets it to closed. */
    cy.getByDataTest('dhis2-analytics-hovermenubar').trigger('keydown', {
        keyCode: 27,
    })
    cy.getByDataTest('dhis2-analytics-hovermenubar')
        .contains('Download')
        .click()
    cy.getByDataTest('dhis2-analytics-hovermenulist').should('be.visible')
    /* A label like JSON is in several submenus, so each step looks in the
     * submenu the previous step opened. */
    menuPath.forEach((label) => {
        cy.get('[data-test="dhis2-analytics-hovermenulist"]')
            .last()
            .contains('[data-test="dhis2-uicore-hovermenulistitem"]', label)
            .click()
    })

    return cy
        .get<sinon.SinonStub>('@windowOpen')
        .should('have.been.calledOnce')
        .its('firstCall.args.0')
        .then(String)
}
