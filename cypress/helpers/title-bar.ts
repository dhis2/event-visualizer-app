export const expectVisTitleToEqual = (value: string) =>
    cy
        .getByDataTest('title-text')
        .should('have.length', 1)
        .and('contain.text', value)
        .and('be.visible')
