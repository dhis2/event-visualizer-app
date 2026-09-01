/* Guards the version tagging described in the README: tests are excluded per
 * backend version with a '@skip-<version>' tag, and untagged tests run against
 * every version. If tag filtering ever stops being applied, the tagged test
 * below runs against 2.43 and fails. */
const instanceVersion = () => String(Cypress.expose('dhis2InstanceVersion'))

describe('version tags', () => {
    it('runs against every supported version', () => {
        cy.wrap(instanceVersion()).should('not.be.empty')
    })

    it('does not run against 2.43', { tags: ['@skip-43'] }, () => {
        cy.wrap(instanceVersion()).should('not.contain', '43')
    })
})
