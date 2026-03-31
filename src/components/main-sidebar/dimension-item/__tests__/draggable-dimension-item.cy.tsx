import { CssVariables } from '@dhis2/ui'
import React from 'react'
import { DraggableDimensionItem } from '../draggable-dimension-item'
import { MockAppWrapper } from '@test-utils/app-wrapper'
import type { DimensionMetadataItem } from '@types'

const testDimension: DimensionMetadataItem = {
    id: 'test-dimension',
    dimensionId: 'test-dimension',
    name: 'Test Dimension',
    dimensionType: 'DATA_ELEMENT',
    valueType: 'TEXT',
}

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MockAppWrapper>
        {children}
        <CssVariables colors spacers theme />
    </MockAppWrapper>
)

describe('<DraggableDimensionItem />', () => {
    it('renders basic dimension item', () => {
        cy.mount(
            <TestWrapper>
                <DraggableDimensionItem dimension={testDimension} />
            </TestWrapper>
        )

        cy.getByDataTest('dimension-item').should('be.visible')
        cy.contains('Test Dimension').should('be.visible')
    })

    it('displays an add button while hovering when not selected and not disabled', () => {
        cy.mount(
            <TestWrapper>
                <DraggableDimensionItem dimension={testDimension} />
            </TestWrapper>
        )

        cy.getByDataTest('add-button-test-dimension')
            .should('exist')
            .and('not.be.visible')
        cy.getByDataTest('subtract-button-test-dimension').should('not.exist')

        cy.getByDataTest('dimension-item-Test-Dimension')
            .should('be.visible')
            .realHover()

        cy.getByDataTest('add-button-test-dimension').should('be.visible')
        cy.getByDataTest('subtract-button-test-dimension').should('not.exist')

        cy.get('body').realHover({ position: 'bottomLeft' })
        cy.getByDataTest('add-button-test-dimension').should('not.be.visible')
    })

    it('does not have a menu button when disabled', () => {
        cy.mount(
            <TestWrapper>
                <DraggableDimensionItem dimension={testDimension} disabled />
            </TestWrapper>
        )

        cy.getByDataTest('add-button-test-dimension').should('not.exist')
        cy.getByDataTest('subtract-button-test-dimension').should('not.exist')
    })

    it('has cursor not-allowed when disabled', () => {
        cy.mount(
            <TestWrapper>
                <DraggableDimensionItem dimension={testDimension} disabled />
            </TestWrapper>
        )

        cy.getByDataTest('dimension-item-Test-Dimension').should(
            'have.css',
            'cursor',
            'not-allowed'
        )
    })
})
