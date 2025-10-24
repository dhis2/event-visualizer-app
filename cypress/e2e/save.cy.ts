import {
    // file-menu
    deleteVisualization,
    resaveVisualization,
    saveVisualizationAs,
    openVisByName,
    // table
    expectVisTitleToEqual,
    expectTableToBeVisible,
    getTableHeaderCells,
    expectTableToBeUpdated,
} from '../helpers/index'

const TEST_VIS_TITLE = `save-test-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}`

const createTestVisualization = (title) => {
    openVisByName('Inpatient: Cases last quarter (case)')

    // capture the current visualization id from the hash route BEFORE saving
    cy.url().then((url) => {
        const match = url.match(/#\/([A-Za-z0-9]+)$/)
        cy.wrap(match[1]).as('initialVisId')
    })

    // save as a new visualization for the renaming test
    saveVisualizationAs(title)
    // after saving as a new visualization the id should have changed
    cy.get('@initialVisId').then((initialVisId) => {
        cy.url().should('not.match', new RegExp(`${initialVisId}$`))
    })

    expectVisTitleToEqual(title)
    expectTableToBeVisible()
}

describe('save', () => {
    it('save works correctly', () => {
        cy.visit('/')
        createTestVisualization(TEST_VIS_TITLE) // saveAs called here

        // change the sorting set the visualization as "dirty"
        getTableHeaderCells().find(`button[title*="Age in years"]`).click()

        expectTableToBeUpdated()

        // extract the id of the saved visualization
        cy.url().then((url) => {
            const match = url.match(/#\/([A-Za-z0-9]+)$/)
            cy.wrap(match[1]).as('visId')
        })

        // intercept and mock fetching subscribers
        cy.intercept(
            'GET',
            /\/api\/\d+\/eventVisualizations\/\w+\?fields=subscribers/,
            {
                statusCode: 200,
                body: {
                    subscribers: ['xE7jOejl9FI'],
                },
            }
        ).as('get-subscribers')

        cy.intercept('PUT', /\/api\/\d+\/eventVisualizations\/\w+/, (req) => {
            // verify that the subscribers are included in the save request
            expect(req.body).to.have.property('subscribers')
            expect(req.body.subscribers).to.deep.equal(['xE7jOejl9FI'])
        }).as('put-save')

        // check that subscribers are included in the response
        cy.intercept(
            'GET',
            /\/api\/\d+\/eventVisualizations\/\w+\?fields=.*id.*/,
            (req) => {
                req.continue((res) => {
                    expect(res.body).to.have.property('subscribers')
                    expect(res.body.subscribers).to.deep.equal(['xE7jOejl9FI'])
                })
            }
        ).as('get-after-save')

        resaveVisualization()

        cy.wait('@get-subscribers')
        cy.wait('@put-save')
        cy.wait('@get-after-save')

        // verify the url hasn't changed
        cy.get('@visId').then((visId) => {
            cy.url().should('match', new RegExp(`${visId}$`))
        })

        deleteVisualization()
    })
})
