import { moveChipToAxis, removeChip, switchVisualizationType } from '../helpers'
import { expectVisualizationToRender } from '../support/rendering'

describe('change a visualization', () => {
    it('switches vis type, moves and removes chips and switches output type', () => {
        cy.visit('/#/C524QgkjodB')
        expectVisualizationToRender({
            type: 'LINE_LIST',
            headers: [
                'Enrollment org. unit',
                'Date of enrollment',
                'Enrollment status',
                'Event org. unit',
                'Event status',
            ],
        })

        switchVisualizationType('Pivot table')
        moveChipToAxis('Event status', 'rows')
        removeChip('Enrollment status')
        cy.getByDataTest('update-button-event').click()

        expectVisualizationToRender({
            type: 'PIVOT_TABLE',
            columnHeaders: ['Sierra Leone'],
            rowHeaders: ['Active', 'Completed'],
        })
        cy.getByDataTest('title-bar').should('contain', 'Edited')
    })
})
