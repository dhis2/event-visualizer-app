import { LayoutPanel } from '../layout-panel'
import { uiSlice, initialState as uiSliceInitialState } from '@store/ui-slice'
import {
    visUiConfigSlice,
    initialState as visUiConfigInitialState,
} from '@store/vis-ui-config-slice'
import { MockAppWrapper, type MockOptions } from '@test-utils/app-wrapper'

const mockOptions: MockOptions = {
    metadata: {
        genderId: {
            uid: 'genderId',
            name: 'Gender',
            dimensionType: 'PROGRAM_ATTRIBUTE',
            valueType: 'TEXT',
        },
        mchInfantFeeding: {
            uid: 'mchInfantFeeding',
            name: 'MCH Infant Feeding',
            dimensionType: 'DATA_ELEMENT',
            valueType: 'TEXT',
        },
        mchNutrition: {
            uid: 'mchNutrition',
            name: 'MCH Nutrition',
            dimensionType: 'DATA_ELEMENT',
            valueType: 'TEXT',
        },
        ou: {
            uid: 'ou',
            name: 'Organisation unit',
            dimensionType: 'ORGANISATION_UNIT',
        },
        ageAtVisit: {
            uid: 'ageAtVisit',
            name: 'Age at visit',
            dimensionType: 'PROGRAM_ATTRIBUTE',
            valueType: 'NUMBER',
        },
    },
    partialStore: {
        reducer: {
            ui: uiSlice.reducer,
            visUiConfig: visUiConfigSlice.reducer,
        },
        preloadedState: {
            ui: uiSliceInitialState,
            visUiConfig: {
                ...visUiConfigInitialState,
                visualizationType: 'LINE_LIST',
                outputType: 'EVENT',
                layout: {
                    columns: ['ou', 'mchInfantFeeding', 'ageAtVisit'],
                    filters: ['genderId', 'mchNutrition'],
                    rows: [],
                },
                itemsByDimension: {
                    ou: ['orgUnit1'],
                },
                conditionsByDimension: {
                    genderId: {
                        condition: 'EQ:male',
                    },
                },
            },
        },
    },
}

describe('<LayoutPanel />', () => {
    it('renders with LINE_LIST visualization type, EVENT input type, 3 column chips and 2 filter chips', () => {
        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <LayoutPanel />
            </MockAppWrapper>
        )

        // Check that 2 groups are rendered
        cy.get('[class*="columns"]').should('be.visible')
        cy.get('[class*="filters"]').should('be.visible')

        // Check that both axes are rendered
        cy.getByDataTest('axis-columns').should('be.visible')
        cy.getByDataTest('axis-filters').should('be.visible')

        // Check axis labels
        cy.getByDataTest('axis-columns')
            .contains('Columns')
            .should('be.visible')
        cy.getByDataTest('axis-filters').contains('Filter').should('be.visible')

        // Verify columns axis has 3 chips
        cy.getByDataTest('axis-columns')
            .findByDataTest('layout-dimension-chip')
            .should('have.length', 3)

        // Verify filters axis has 2 chips
        cy.getByDataTest('axis-filters')
            .findByDataTest('layout-dimension-chip')
            .should('have.length', 2)

        // Check that the correct dimension names are displayed
        cy.contains('Gender').should('be.visible')
        cy.contains('MCH Infant Feeding').should('be.visible')
        cy.contains('Organisation unit').should('be.visible')
        cy.contains('Age at visit').should('be.visible')
        cy.contains('MCH Nutrition').should('be.visible')

        // Verify the chips are in the correct axes
        cy.getByDataTest('axis-columns').within(() => {
            cy.contains('Organisation unit').should('be.visible')
            cy.contains('MCH Infant Feeding').should('be.visible')
            cy.contains('Age at visit').should('be.visible')
        })

        cy.getByDataTest('axis-filters').within(() => {
            cy.contains('Gender').should('be.visible')
            cy.contains('MCH Nutrition').should('be.visible')
        })
    })
})
