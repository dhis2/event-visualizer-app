export const expectVisTitleToContain = (value: string) =>
    cy
        .getByDataTest('title-text')
        .should('have.length', 1)
        .and('be.visible')
        .and('contain', value)

export const expectVisTitleToEqual = (value: string) =>
    cy
        .getByDataTest('title-text')
        .should('have.length', 1)
        .and('contain.text', value)
        .and('be.visible')
