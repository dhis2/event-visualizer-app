export const typeInput = (target, text) =>
    cy.getByDataTestLike(target).find('input').type(text)

export const clearInput = (target) =>
    cy.getByDataTest(target).find('input').clear()

export const typeTextarea = (target, text) =>
    cy.getByDataTest(target).find('textarea').type(text)

export const clearTextarea = (target) =>
    cy.getByDataTest(target).find('textarea').clear()
