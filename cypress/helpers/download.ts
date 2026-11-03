/* The app opens downloads with window.open, which Cypress can't follow. The
 * stub catches the URL, so the test can request it. */
export const stubWindowOpen = () =>
    cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen')
    })

const clickDownloadMenu = () =>
    cy
        .getByDataTest('dhis2-analytics-hovermenubar')
        .contains('Download')
        .click()

export const downloadUrlFor = (menuPath: string[]) => {
    /* After a download the menu bar still counts as open, so a click on
     * Download closes it: click again if the list didn't open. */
    clickDownloadMenu()
    cy.get('body').then(($body) => {
        if (
            !$body.find('[data-test="dhis2-uicore-hovermenulistitem"]').length
        ) {
            clickDownloadMenu()
        }
    })
    /* A label like JSON is in several submenus, so each step looks in the
     * submenu the previous step opened. */
    menuPath.forEach((label) => {
        cy.get('[data-test="dhis2-analytics-hovermenulist"]')
            .last()
            .contains('[data-test="dhis2-uicore-hovermenulistitem"]', label)
            .click()
    })

    return cy.get('@windowOpen').its('lastCall.args.0').then(String)
}
