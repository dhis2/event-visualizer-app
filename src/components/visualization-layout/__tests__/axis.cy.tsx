import { CssVariables } from '@dhis2/ui'
import React from 'react'
import { Axis, getAxisName } from '../axis'
import { SUPPORTED_AXIS_IDS } from '@constants/axis-types'

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <>
        {children}
        <CssVariables colors spacers theme />
    </>
)

const [AXIS_ID_COLUMNS, AXIS_ID_FILTERS] = SUPPORTED_AXIS_IDS

describe('<Axis />', () => {
    it('renders left axis with columns configuration and no dimensions when dimensionIds not provided', () => {
        cy.mount(
            <TestWrapper>
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

    it('renders left axis with specific dimensions when dimensionIds provided', () => {
        const dimensionIds = ['incident-date', 'age']

        cy.mount(
            <TestWrapper>
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
        cy.contains('Incident date').should('be.visible')
        cy.contains('Age').should('be.visible')
    })

    it('renders all available dimensions when all dimensionIds provided', () => {
        const allDimensionIds = ['incident-date', 'bombali', 'age']

        cy.mount(
            <TestWrapper>
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
        cy.mount(
            <TestWrapper>
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
        cy.mount(
            <TestWrapper>
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
        cy.mount(
            <TestWrapper>
                <Axis axisId={AXIS_ID_COLUMNS} dimensionIds={[]} side="left" />
            </TestWrapper>
        )

        cy.getByDataTest('axis-AXIS_ID_COLUMNS-left').should('be.visible')
        cy.contains('Columns').should('be.visible')
        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })

    it('handles non-existent dimensionIds gracefully', () => {
        cy.mount(
            <TestWrapper>
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
