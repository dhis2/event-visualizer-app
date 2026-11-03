import { expectVisTitleToEqual, renameVisualization } from '../../helpers'
import { deleteVisualizationViaApi, getVisualization } from '../../support/api'
import { testObjectName } from '../../support/names'

const LEGACY_ID = 'PRVegIpABeb'
const LEGACY_NAME = 'Inpatient: Visit overview this year Bo'

describe('legacy rename', () => {
    let copyId: string | undefined

    after(() => {
        if (copyId) {
            deleteVisualizationViaApi(copyId)
        }
    })

    it('saves a renamed legacy visualization as a new one', () => {
        const name = testObjectName('legacy rename')
        cy.visit(`/#/${LEGACY_ID}`)
        expectVisTitleToEqual(LEGACY_NAME)

        renameVisualization(name)
        cy.getByDataTest('legacy-rename-modal').should('be.visible')
        cy.getByDataTest('legacy-rename-modal-save-as-new').click()

        cy.location('hash')
            .should('match', /^#\/[A-Za-z0-9]{11}$/)
            .and('not.contain', LEGACY_ID)
            .then((hash) => {
                copyId = hash.slice(2)
            })
        expectVisTitleToEqual(name)

        getVisualization(LEGACY_ID, 'name,legacy').should('deep.include', {
            name: LEGACY_NAME,
            legacy: true,
        })
    })
})
