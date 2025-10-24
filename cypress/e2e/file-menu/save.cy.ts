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
    expectStartScreenToBeVisible,
} from '../../helpers/index'
import { getApiBaseUrl } from '../../support/utils'

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

    // save as a new visualization for the test
    saveVisualizationAs(title)
    // after saving as a new visualization the id should have changed
    cy.get('@initialVisId').then((initialVisId) => {
        cy.url().should('not.match', new RegExp(`${initialVisId}$`))
    })

    expectVisTitleToEqual(title)
    expectTableToBeVisible()
}

describe('save and save as', () => {
    it('save and save as', () => {
        cy.visit('/')
        createTestVisualization(TEST_VIS_TITLE)

        // change the sorting set the visualization as "dirty"
        getTableHeaderCells().find(`button[title*="Age in years"]`).click()

        expectTableToBeVisible()

        // extract the id of the saved visualization
        cy.url().then((url) => {
            const match = url.match(/#\/([A-Za-z0-9]+)$/)
            cy.wrap(match[1]).as('originalVisId')
        })

        // intercept and mock subscribers
        cy.intercept(
            {
                method: 'GET',
                url: /\/api\/\d+\/eventVisualizations\/\w+\?fields=subscribers/,
                times: 1,
            },
            {
                statusCode: 200,
                body: {
                    subscribers: ['xE7jOejl9FI'],
                },
            }
        ).as('get-subscribers')

        cy.intercept(
            {
                method: 'PUT',
                url: /\/api\/\d+\/eventVisualizations\/\w+/,
                times: 1,
            },
            (req) => {
                // verify that the subscribers are included in the save request
                expect(req.body).to.have.property('subscribers')
                expect(req.body.subscribers).to.deep.equal(['xE7jOejl9FI'])
            }
        ).as('put-event-vis')

        // check that subscribers are included in the response
        cy.intercept(
            {
                method: 'GET',
                url: /\/api\/\d+\/eventVisualizations\/\w+\?fields=.*id.*/,
                times: 1,
            },
            (req) => {
                req.continue((res) => {
                    expect(res.body).to.have.property('subscribers')
                    expect(res.body.subscribers).to.deep.equal(['xE7jOejl9FI'])
                })
            }
        ).as('get-eventVis-after-save')

        resaveVisualization()

        cy.wait('@get-subscribers')
        cy.wait('@put-event-vis')
        cy.wait('@get-eventVis-after-save')

        // verify the url hasn't changed
        cy.get('@originalVisId').then((originalVisId) => {
            cy.url().should('match', new RegExp(`${originalVisId}$`))
        })

        expectTableToBeVisible()

        // SAVE AS

        cy.get('@originalVisId').then((originalVisId) => {
            // match exactly 11 alphanumeric characters for the id and allow
            // optional query params; exclude the original visId so we target
            // the newly created visualization
            const urlRegex = new RegExp(
                '/api/\\d+/eventVisualizations/(?!' +
                    originalVisId +
                    '\\b)[A-Za-z0-9]{11}(?:\\?.*)?$'
            )

            cy.intercept({ method: 'GET', url: urlRegex, times: 1 }).as(
                'get-eventVis-after-save-as'
            )

            const newTitle = `${TEST_VIS_TITLE}-v2`
            saveVisualizationAs(newTitle)

            expectTableToBeVisible()

            cy.wait('@get-eventVis-after-save-as').then(
                ({ response, request }) => {
                    expect(response.body).to.have.property('subscribers')
                    expect(response.body.subscribers).to.deep.equal([])
                    expect(request.url).not.to.match(
                        new RegExp(`${originalVisId}$`)
                    )
                }
            )

            expectVisTitleToEqual(newTitle)
            expectTableToBeVisible()

            // Delete the test visualizations
            deleteVisualization()
            cy.getByDataTest('title-bar').should('not.exist')
            expectStartScreenToBeVisible()

            cy.request({
                method: 'DELETE',
                url: `${getApiBaseUrl()}/eventVisualizations/${originalVisId}`,
                failOnStatusCode: false, // carry on even if the delete fails
            })

            expectStartScreenToBeVisible()
        })
    })
})
