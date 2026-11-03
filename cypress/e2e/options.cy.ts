import { applyOptions, openOptions } from '../helpers'

const getPivotTableHeaders = () =>
    cy.get(
        '[data-test="visualization-column-header"], [data-test="visualization-row-header"]'
    )

describe('options', () => {
    it('applies a custom title to a line list', () => {
        const title = 'E2E-IDV custom title'
        cy.visit('/#/t6SxiQdVPVs')
        cy.getByDataTest('table-row').should('have.length.greaterThan', 0)

        openOptions('Style')
        cy.getByDataTest('title-mode-custom').click()
        cy.getByDataTest('title-input').find('input').type(title)
        applyOptions()

        cy.getByDataTest('line-list-data-table')
            .contains(title)
            .should('be.visible')
    })

    it('turns off the totals of a pivot table', () => {
        cy.visit('/#/t6KrUiPqcd0')
        getPivotTableHeaders().should('contain', 'Total')

        openOptions('Data')
        cy.getByDataTest('options-modal-content')
            .contains('label', 'Column totals')
            .click()
        cy.getByDataTest('options-modal-content')
            .contains('label', 'Row totals')
            .click()
        applyOptions()

        getPivotTableHeaders().should('not.contain', 'Total')
    })
})
