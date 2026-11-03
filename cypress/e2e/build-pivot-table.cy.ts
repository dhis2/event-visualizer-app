import {
    addDimensionFromModal,
    expectVisTitleToEqual,
    openDimensionModal,
    saveVisualization,
    selectDataSource,
    switchVisualizationType,
} from '../helpers'
import { deleteVisualizationViaApi } from '../support/api'
import { testObjectName } from '../support/names'
import type { ExpectedRendering } from '../support/rendering'
import { expectVisualizationToRender } from '../support/rendering'

const STAGE = 'Birth'

const EXPECTED: ExpectedRendering = {
    type: 'PIVOT_TABLE',
    columnHeaders: ['NVP only', 'Others'],
    rowHeaders: ['Exclusive'],
}

describe('build a pivot table', () => {
    let visualizationId: string | undefined

    after(() => {
        if (visualizationId) {
            deleteVisualizationViaApi(visualizationId)
        }
    })

    it('builds, saves and reloads an event pivot table with a cell value', () => {
        cy.visit('/#/new')

        selectDataSource('Child Programme')
        switchVisualizationType('Pivot table')

        openDimensionModal('MCH ARV at birth', STAGE)
        addDimensionFromModal('columns')

        openDimensionModal('MCH Infant Feeding', STAGE)
        addDimensionFromModal('rows')

        openDimensionModal('Report date', STAGE)
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
        addDimensionFromModal('filters')

        openDimensionModal('MCH Weight (g)', STAGE)
        addDimensionFromModal('value')
        cy.getByDataTest('cell-value-aggregation-trigger').click()
        cy.getByDataTest('cell-value-aggregation-item-AVERAGE').click()

        cy.getByDataTest('update-button-event').click()

        expectVisualizationToRender(EXPECTED)
        cy.getByDataTest('cell-value-label').should('contain', 'MCH Weight (g)')

        const name = testObjectName('pivot table')
        saveVisualization(name)
        expectVisTitleToEqual(name)
        cy.location('hash')
            .should('match', /^#\/[A-Za-z0-9]{11}$/)
            .then((hash) => {
                visualizationId = hash.slice(2)
            })

        cy.reload()

        expectVisTitleToEqual(name)
        expectVisualizationToRender(EXPECTED)
    })
})
