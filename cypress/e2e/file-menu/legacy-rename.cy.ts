import { expectVisTitleToEqual, renameVisualization } from '../../helpers'
import { deleteVisualizationsByName, getVisualization } from '../../support/api'
import { testObjectName } from '../../support/names'
import {
    expectVisualizationToRender,
    getHeaderTexts,
} from '../../support/rendering'

const LEGACY_ID = 'PRVegIpABeb'
const LEGACY_NAME = 'Inpatient: Visit overview this year Bo'

describe('legacy rename', () => {
    const names: string[] = []

    /* afterEach, because a retry starts the test again and may save another */
    afterEach(() => {
        names.splice(0).forEach(deleteVisualizationsByName)
    })

    it('saves a renamed legacy visualization as a new one', () => {
        const name = testObjectName('legacy rename')
        names.push(name)
        cy.visit(`/#/${LEGACY_ID}`)
        expectVisTitleToEqual(LEGACY_NAME)
        cy.getByDataTest('table-row').should('have.length.greaterThan', 0)
        cy.getByDataTest('data-table-header')
            .then(getHeaderTexts)
            .as('legacyHeaders')

        renameVisualization(name)
        cy.getByDataTest('legacy-rename-modal').should('be.visible')
        cy.getByDataTest('legacy-rename-modal-save-as-new').click()

        cy.location('hash')
            .should('match', /^#\/[A-Za-z0-9]{11}$/)
            .and('not.contain', LEGACY_ID)
        expectVisTitleToEqual(name)
        cy.get<string[]>('@legacyHeaders').then((headers) =>
            expectVisualizationToRender({ type: 'LINE_LIST', headers })
        )

        getVisualization(LEGACY_ID, 'name,legacy').should('deep.include', {
            name: LEGACY_NAME,
            legacy: true,
        })
    })
})
