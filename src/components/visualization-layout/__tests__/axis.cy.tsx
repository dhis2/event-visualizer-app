import { CssVariables } from '@dhis2/ui'
import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'
import { Axis, getAxisName } from '../axis'
import { MetadataProvider } from '@components/app-wrapper/metadata-provider'
import { AXIS_ID_COLUMNS, AXIS_ID_FILTERS } from '@constants/axis-types'
import { visConfigSlice, initialState } from '@store/vis-config-slice'

// Create a test store with the vis-config slice
const createTestStore = (preloadedState = {}) => {
    return configureStore({
        reducer: {
            visConfig: visConfigSlice.reducer,
        },
        preloadedState: {
            visConfig: { ...initialState, ...preloadedState },
        },
    })
}

// Mock metadata items for testing
const mockMetadataItems = {
    genderId: {
        id: 'genderId',
        name: 'Gender',
        valueType: 'PROGRAM_ATTRIBUTE',
    },
    'A03MvHHogjR.X8zyunlgUfM': {
        id: 'A03MvHHogjR.X8zyunlgUfM',
        dimensionId: 'X8zyunlgUfM',
        name: 'MCH Infant Feeding',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    },
    ou: {
        id: 'ou',
        name: 'Organisation unit',
        dimensionType: 'ORGANISATION_UNIT',
    },
}

const TestWrapper: React.FC<{
    children: React.ReactNode
    store?: ReturnType<typeof createTestStore>
}> = ({ children, store = createTestStore() }) => (
    <Provider store={store}>
        <MetadataProvider initialMetadataItems={mockMetadataItems}>
            {children}
            <CssVariables colors spacers theme />
        </MetadataProvider>
    </Provider>
)

describe('<Axis />', () => {
    it.skip('renders left axis with columns configuration and no dimensions when dimensionIds not provided', () => {
        const store = createTestStore({
            inputType: 'EVENT',
        })

        cy.mount(
            <TestWrapper store={store}>
                <Axis axisId={AXIS_ID_COLUMNS} side="left" />
            </TestWrapper>
        )

        cy.getByDataTest('axis-AXIS_ID_COLUMNS-left')
            .should('be.visible')
            .and('have.css', 'flex-basis', '65%')

        cy.contains('Columns').should('be.visible')

        // No chips should be rendered when no dimensionIds provided
        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })

    it.only('renders left axis with specific dimensions when dimensionIds provided', () => {
        const dimensionIds = ['ou', 'genderId']
        const store = createTestStore({
            inputType: 'EVENT',
        })

        cy.mount(
            <TestWrapper store={store}>
                <Axis
                    axisId={AXIS_ID_COLUMNS}
                    dimensionIds={dimensionIds}
                    side="left"
                />
            </TestWrapper>
        )

        cy.getByDataTest('axis-AXIS_ID_COLUMNS-left').should('be.visible')
        cy.contains('Columns').should('be.visible')

        // Should render chips for the provided dimension IDs
        cy.getByDataTest('layout-dimension-chip').should('have.length', 2)
        cy.contains('Organisation unit').should('be.visible')
        cy.contains('Gender').should('be.visible')
    })

    it('renders all available dimensions when all dimensionIds provided', () => {
        const allDimensionIds = ['incident-date', 'bombali', 'age']
        const store = createTestStore({
            inputType: 'EVENT',
        })

        cy.mount(
            <TestWrapper store={store}>
                <Axis
                    axisId={AXIS_ID_COLUMNS}
                    dimensionIds={allDimensionIds}
                    side="left"
                />
            </TestWrapper>
        )

        cy.getByDataTest('layout-dimension-chip').should('have.length', 3)
        cy.contains('Incident date').should('be.visible')
        cy.contains('Bombali').should('be.visible')
        cy.contains('Age').should('be.visible')
    })

    it('renders right axis with filters configuration', () => {
        const store = createTestStore({
            inputType: 'EVENT',
        })

        cy.mount(
            <TestWrapper store={store}>
                <Axis axisId={AXIS_ID_FILTERS} side="right" />
            </TestWrapper>
        )

        cy.getByDataTest('axis-AXIS_ID_FILTERS-right')
            .should('be.visible')
            .and('have.css', 'flex-basis', '35%')

        // Check the axis label
        cy.contains('Filter').should('be.visible')

        // No chips should be rendered when no dimensionIds provided
        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })

    it('filters dimensions correctly based on dimensionIds', () => {
        const store = createTestStore({
            inputType: 'EVENT',
        })

        cy.mount(
            <TestWrapper store={store}>
                <Axis
                    axisId={AXIS_ID_FILTERS}
                    dimensionIds={['bombali']}
                    side="right"
                />
            </TestWrapper>
        )

        cy.getByDataTest('layout-dimension-chip').should('have.length', 1)
        cy.contains('Bombali').should('be.visible')
        cy.contains('Incident date').should('not.exist')
        cy.contains('Age').should('not.exist')
    })

    it('handles empty dimensionIds array', () => {
        const store = createTestStore({
            inputType: 'EVENT',
        })

        cy.mount(
            <TestWrapper store={store}>
                <Axis axisId={AXIS_ID_COLUMNS} dimensionIds={[]} side="left" />
            </TestWrapper>
        )

        cy.getByDataTest('axis-AXIS_ID_COLUMNS-left').should('be.visible')
        cy.contains('Columns').should('be.visible')
        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })

    it('handles non-existent dimensionIds gracefully', () => {
        const store = createTestStore({
            inputType: 'EVENT',
        })

        cy.mount(
            <TestWrapper store={store}>
                <Axis
                    axisId={AXIS_ID_COLUMNS}
                    dimensionIds={['non-existent-id']}
                    side="left"
                />
            </TestWrapper>
        )

        cy.getByDataTest('axis-AXIS_ID_COLUMNS-left').should('be.visible')
        cy.contains('Columns').should('be.visible')
        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })
})

describe('getAxisName helper function', () => {
    it('returns correct axis names', () => {
        expect(getAxisName(AXIS_ID_COLUMNS)).to.equal('Columns')
        expect(getAxisName(AXIS_ID_FILTERS)).to.equal('Filter')
    })
})
