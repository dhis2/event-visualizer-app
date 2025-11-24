import { Axis } from '../axis'
import { visUiConfigSlice, initialState } from '@store/vis-ui-config-slice'
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
        ou: {
            uid: 'ou',
            name: 'Organisation unit',
            dimensionType: 'ORGANISATION_UNIT',
        },
    },
    partialStore: {
        reducer: { visUiConfig: visUiConfigSlice.reducer },
        preloadedState: {
            visUiConfig: {
                ...initialState,
                itemsByDimension: {
                    ou: ['someOrgUnitId'],
                },
            },
        },
    },
}

describe('<Axis />', () => {
    it('renders start axis with columns configuration and no dimensions', () => {
        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <Axis axisId="columns" />
            </MockAppWrapper>
        )

        cy.getByDataTest('axis-columns').should('be.visible')

        cy.contains('Columns').should('be.visible')

        // No chips should be rendered when no dimensionIds provided
        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })

    it('renders start axis with columns with dimensions', () => {
        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <Axis axisId="columns" dimensionIds={['ou', 'genderId']} />
            </MockAppWrapper>
        )

        cy.getByDataTest('axis-columns').should('be.visible')

        cy.contains('Columns').should('be.visible')

        cy.getByDataTest('layout-dimension-chip').should('have.length', 2)
        cy.contains('Organisation unit').should('be.visible')
        cy.contains('Gender').should('be.visible')
        cy.contains('MCH Infant Feeding').should('not.exist')
    })

    it('renders end axis with filters with no dimensions', () => {
        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <Axis axisId="filters" />
            </MockAppWrapper>
        )

        cy.getByDataTest('axis-filters').should('be.visible')

        cy.contains('Filter').should('be.visible')

        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })

    it('renders end axis with filters with dimensions', () => {
        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <Axis
                    axisId="filters"
                    dimensionIds={['ou', 'mchInfantFeeding']}
                />
            </MockAppWrapper>
        )

        cy.getByDataTest('axis-filters').should('be.visible')

        cy.getByDataTest('layout-dimension-chip').should('have.length', 2)
        cy.contains('Organisation unit').should('be.visible')
        cy.contains('MCH Infant Feeding').should('be.visible')
        cy.contains('Gender').should('not.exist')
    })

    it('handles empty dimenssionIds array', () => {
        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <Axis axisId="columns" dimensionIds={[]} />
            </MockAppWrapper>
        )

        cy.getByDataTest('axis-columns').should('be.visible')
        cy.contains('Columns').should('be.visible')
        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })
})
