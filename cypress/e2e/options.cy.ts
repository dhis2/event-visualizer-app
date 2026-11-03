import { applyOptions, openOptions } from '../helpers'
import { expectVisualizationToRender } from '../support/rendering'

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

    it('applies totals and hides empty rows in a pivot table', () => {
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

        openOptions('Data')
        cy.getByDataTest('options-modal-content')
            .contains('label', 'Hide empty rows')
            .click()
        applyOptions()

        expectVisualizationToRender({
            type: 'PIVOT_TABLE',
            columnHeaders: ['Male', '0 - 10', '10 - 20'],
            rowHeaders: ['Bo', 'Western Area'],
        })
    })
})
