import {
    addDimensionFromModal,
    addDimensionToColumns,
    expectVisTitleToEqual,
    openDimensionModal,
    saveVisualization,
    selectDataSource,
} from '../helpers'
import { deleteVisualizationsByName } from '../support/api'
import { testObjectName } from '../support/names'
import type { ExpectedRendering } from '../support/rendering'
import { expectVisualizationToRender } from '../support/rendering'

const EXPECTED: ExpectedRendering = {
    type: 'LINE_LIST',
    headers: [
        'Gender',
        'Age in years',
        'Mode of Discharge',
        'Report date',
        'Event org. unit',
    ],
}

describe('build a line list', () => {
    const names: string[] = []

    /* afterEach, because a retry starts the test again and may save another */
    afterEach(() => {
        names.splice(0).forEach(deleteVisualizationsByName)
    })

    it('builds, saves and reloads an event line list', () => {
        cy.visit('/#/new')

        selectDataSource('Inpatient morbidity and mortality')

        addDimensionToColumns('Gender')

        openDimensionModal('Age in years')
        cy.get('[data-test$="-filter-radio-filter"]').click()
        cy.getByDataTest('dimension-modal')
            .contains('Choose a filter type')
            .click()
        cy.contains('greater than or equal to (≥)').click()
        cy.getByDataTest('dimension-modal')
            .find('input[type="number"]')
            .type('18')
        addDimensionFromModal('columns')

        addDimensionToColumns('Mode of Discharge')

        openDimensionModal('Report date')
        cy.getByDataTest('period-dimension-transfer')
            .contains('Last 12 months')
            .dblclick()
        cy.getByDataTest(
            'period-dimension-relative-period-filter-period-type'
        ).click()
        cy.getByDataTest(
            'period-dimension-relative-period-filter-period-type-option-YEARLY'
        ).click()
        cy.getByDataTest('period-dimension-transfer')
            .contains('This year')
            .dblclick()
        addDimensionFromModal('columns')

        openDimensionModal('Event org. unit')
        cy.getByDataTest('org-unit-tree').contains('Sierra Leone').click()
        addDimensionFromModal('columns')

        cy.getByDataTest('update-button-event').click()

        expectVisualizationToRender(EXPECTED)
        cy.getByDataTest('data-table-header')
            .contains('Age in years')
            .parents('th')
            .invoke('index')
            .then((ageColumn) =>
                cy.getByDataTest('table-row').each(($row) => {
                    const age = Number($row.children().eq(ageColumn).text())
                    expect(age).to.be.at.least(18)
                })
            )

        const name = testObjectName('line list')
        names.push(name)
        saveVisualization(name)
        expectVisTitleToEqual(name)
        cy.location('hash').should('match', /^#\/[A-Za-z0-9]{11}$/)

        cy.reload()

        expectVisTitleToEqual(name)
        expectVisualizationToRender(EXPECTED)
    })
})
