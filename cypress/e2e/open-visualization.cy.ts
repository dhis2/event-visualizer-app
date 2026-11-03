import { expectVisTitleToEqual, openVisByName } from '../helpers'
import { expectVisualizationToRender } from '../support/rendering'

describe('open a visualization', () => {
    it('opens a visualization from the most viewed list', () => {
        cy.visit('/')

        cy.getByDataTest('start-screen-most-viewed-list-item')
            .first()
            .invoke('text')
            .then((name) => {
                cy.getByDataTest('start-screen-most-viewed-list-item')
                    .first()
                    .click()

                cy.location('hash').should('match', /^#\/[A-Za-z0-9]{11}$/)
                expectVisTitleToEqual(name.trim())
            })
    })

    it('opens a visualization through File → Open', () => {
        cy.visit('/')

        openVisByName('E2E: Event line list, event program')

        expectVisualizationToRender({
            type: 'LINE_LIST',
            headers: [
                'Event org. unit',
                'Report date',
                'Gender',
                'Age in years',
                'Weight in kg',
                'Mode of Discharge',
                'Inpatient bed days average',
                'Last updated on',
            ],
        })
    })
})
