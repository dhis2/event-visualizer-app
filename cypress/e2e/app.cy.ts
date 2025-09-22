describe('bootstrapped app', () => {
    beforeEach(() => {
        cy.visit('/')
    })
    it('can open the profile menu', () => {
        cy.getByDataTest('headerbar-profile').should('exist').click()
        cy.contains('Logout').should('be.visible')
    })
})
