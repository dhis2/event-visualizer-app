export const typeInput = (target: string, text: string) =>
    cy.getByDataTestLike(target).find('input').type(text)

export const clearInput = (target: string) =>
    cy.getByDataTest(target).find('input').clear()

export const typeTextarea = (target: string, text: string) =>
    cy.getByDataTest(target).find('textarea').type(text)

export const clearTextarea = (target: string) =>
    cy.getByDataTest(target).find('textarea').clear()
