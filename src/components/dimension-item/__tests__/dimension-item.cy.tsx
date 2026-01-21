import { CssVariables } from '@dhis2/ui'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import React from 'react'
import { DraggableDimensionItem as DimensionItem } from '../draggable-dimension-item'

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ height: '100vh' }}>
        <DndContext>
            <SortableContext
                items={['test-item']}
                strategy={rectSortingStrategy}
            >
                {children}
            </SortableContext>
        </DndContext>
        <CssVariables colors spacers theme />
    </div>
)

describe('<DimensionItem />', () => {
    const defaultProps = {
        id: 'test-dimension',
        name: 'Test Dimension',
        dimensionType: 'PROGRAM_DATA_ELEMENT' as const,
        valueType: 'TEXT' as const,
        optionSet: null,
        disabled: false,
        selected: false,
    }

    it('renders basic dimension item', () => {
        cy.mount(
            <TestWrapper>
                <DimensionItem {...defaultProps} />
            </TestWrapper>
        )

        cy.getByDataTest('dimension-item-Test-Dimension').should('be.visible')
        cy.contains('Test Dimension').should('be.visible')
    })

    it('renders with stage name', () => {
        cy.mount(
            <TestWrapper>
                <DimensionItem {...defaultProps} stageName="Stage 1" />
            </TestWrapper>
        )

        cy.contains('Test Dimension').should('be.visible')
        cy.contains('Stage 1').should('be.visible')
    })

    it('displays an add button while hovering when not selected and not disabled', () => {
        cy.mount(
            <TestWrapper>
                <DimensionItem {...defaultProps} />
            </TestWrapper>
        )

        // Verify the button exists but is not visible initially
        cy.getByDataTest('add-button-test-dimension')
            .should('exist')
            .and('not.be.visible')
        cy.getByDataTest('subtract-button-test-dimension').should('not.exist')

        // Hover over the dimension item
        cy.getByDataTest('dimension-item-Test-Dimension')
            .should('be.visible')
            .realHover()

        // Verify the add button is now visible
        cy.getByDataTest('add-button-test-dimension').should('be.visible')
        cy.getByDataTest('subtract-button-test-dimension').should('not.exist')

        // Move the cursor away to prevent odd things in the next tests
        cy.get('body').realHover({ position: 'bottomLeft' })
        cy.getByDataTest('add-button-test-dimension').should('not.be.visible')
    })

    it('displays a subtract button while hovering when selected and not disabled', () => {
        cy.mount(
            <TestWrapper>
                <DimensionItem {...defaultProps} selected={true} />
            </TestWrapper>
        )

        // Verify the button exists but is not visible initially
        cy.getByDataTest('add-button-test-dimension').should('not.exist')
        cy.getByDataTest('subtract-button-test-dimension')
            .should('exist')
            .and('not.be.visible')

        // Hover over the dimension item
        cy.getByDataTest('dimension-item-Test-Dimension')
            .should('be.visible')
            .realHover()

        // Verify the subtract button is now visible
        cy.getByDataTest('add-button-test-dimension').should('not.exist')
        cy.getByDataTest('subtract-button-test-dimension').should('be.visible')

        // Move the cursor away to prevent odd things in the next tests
        cy.get('body').realHover({ position: 'bottomLeft' })
        cy.getByDataTest('subtract-button-test-dimension').should(
            'not.be.visible'
        )
    })

    it('does not have a menu button when disabled', () => {
        cy.mount(
            <TestWrapper>
                <DimensionItem {...defaultProps} disabled={true} />
            </TestWrapper>
        )

        cy.getByDataTest('item-button-Test-Dimension').should('not.exist')
    })

    it('has teal-100 background color when selected', () => {
        cy.mount(
            <TestWrapper>
                <DimensionItem {...defaultProps} selected={true} />
            </TestWrapper>
        )

        cy.getByDataTest('dimension-item-Test-Dimension').should(
            'have.css',
            'background-color',
            'rgb(224, 242, 241)' // teal-100
        )
    })

    it('has cursor not-allowed when disabled', () => {
        cy.mount(
            <TestWrapper>
                <DimensionItem {...defaultProps} disabled={true} />
            </TestWrapper>
        )

        // Check that the disabled styling is applied
        cy.getByDataTest('dimension-item-Test-Dimension').should(
            'have.css',
            'cursor',
            'not-allowed'
        )
    })
})
