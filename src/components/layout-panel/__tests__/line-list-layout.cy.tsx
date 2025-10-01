import { LineListLayout } from '../line-list-layout'
import { visUiConfigSlice, initialState } from '@store/vis-ui-config-slice'
import { MockAppWrapper, type MockOptions } from '@test-utils/app-wrapper'

const createMockOptions = (preloadedState = {}): MockOptions => ({
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
        ou: {
            uid: 'ou',
            name: 'Organisation unit',
            dimensionType: 'ORGANISATION_UNIT',
        },
    },
    partialStore: {
        reducer: {
            visUiConfig: visUiConfigSlice.reducer,
        },
        preloadedState: {
            visUiConfig: { ...initialState, ...preloadedState },
        },
    },
})

describe('<LineListLayout />', () => {
    it('renders with LINE_LIST visualization type, EVENT input type, 2 column chips and 1 filter chip', () => {
        /* TODO: We don't need a function here we can just work witha static `mockOptions`
         * const but it is currently impossible to do so, due to the issue below */
        const mockOptions = createMockOptions({
            visualizationType: 'LINE_LIST',
            inputType: 'EVENT',
            layout: {
                columns: ['ou', 'mchInfantFeeding'], // 2 dimensions for columns
                filters: ['genderId'], // 1 dimension for filters
                rows: [],
            },
            itemsByDimension: {
                ou: ['orgUnit1'],
            },
            conditionsByDimension: {
                condition: {
                    /* TODO: genderId does not match the type signature. We need to investigate if
                     * the type is wrong, or this partial state is wrong. Using this partial state directly
                     * the `preloadedState` you get the following type error:
                     * Type '{ condition: { genderId: string; }; }' is not assignable to type
                     * 'Record<string, { * condition?: string | undefined; legendSet?: string | undefined; }>' */
                    genderId: 'IN:male',
                },
            },
        })

        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <LineListLayout />
            </MockAppWrapper>
        )

        // Check that the layout container is rendered
        cy.get('[class*="layoutContainer"]').should('be.visible')

        // Check that both axes are rendered
        cy.getByDataTest('axis-columns-start').should('be.visible')
        cy.getByDataTest('axis-filters-end').should('be.visible')

        // Check axis labels
        cy.getByDataTest('axis-columns-start')
            .contains('Columns')
            .should('be.visible')
        cy.getByDataTest('axis-filters-end')
            .contains('Filter')
            .should('be.visible')

        // Verify columns axis has 2 chips
        cy.getByDataTest('axis-columns-start')
            .find('[data-test="layout-dimension-chip"]')
            .should('have.length', 2)

        // Verify filters axis has 1 chip
        cy.getByDataTest('axis-filters-end')
            .find('[data-test="layout-dimension-chip"]')
            .should('have.length', 1)

        // Check that the correct dimension names are displayed
        cy.contains('Gender').should('be.visible')
        cy.contains('MCH Infant Feeding').should('be.visible')
        cy.contains('Organisation unit').should('be.visible')

        // Verify the chips are in the correct axes
        cy.getByDataTest('axis-columns-start').within(() => {
            cy.contains('Organisation unit').should('be.visible')
            cy.contains('MCH Infant Feeding').should('be.visible')
        })

        cy.getByDataTest('axis-filters-end').within(() => {
            cy.contains('Gender').should('be.visible')
        })
    })
})
