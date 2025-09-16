describe('bootstrapped app', () => {
    beforeEach(() => {
        cy.visit('/')
    })
    it('shows the expected welcome text', () => {
        cy.contains('Welcome to DHIS2 with TypeScript!').should('be.visible')
    })
    it('can open the profile menu', () => {
        cy.getByDataTest('headerbar-profile').should('exist').click()
        cy.contains('Logout').should('be.visible')
    })
})
