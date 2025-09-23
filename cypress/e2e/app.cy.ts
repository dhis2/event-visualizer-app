describe('bootstrapped app', () => {
    beforeEach(() => {
        cy.visit('/')
    })

    it('shows the landing page', () => {
        cy.contains('Getting started').should('be.visible')
    })

    it('can open the profile menu', () => {
        cy.getByDataTest('headerbar-profile').should('exist').click()
        cy.contains('Logout').should('be.visible')
    })
})
