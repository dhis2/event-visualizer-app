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
    it('renders left axis with columns configuration', () => {
        cy.mount(
            <TestWrapper>
                <Axis axisId={AXIS_ID_COLUMNS} side="left" />
            </TestWrapper>
        )

        cy.getByDataTest('axis-AXIS_ID_COLUMNS-left')
            .should('be.visible')
            .and('have.css', 'flex-basis', '65%')

        cy.contains('Columns').should('be.visible')

        cy.getByDataTest('layout-dimension-chip').should('have.length', 3)
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
    })
})

describe('getAxisName helper function', () => {
    it('returns correct axis names', () => {
        expect(getAxisName(AXIS_ID_COLUMNS)).to.equal('Columns')
        expect(getAxisName(AXIS_ID_FILTERS)).to.equal('Filter')
    })
})
