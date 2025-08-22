import { DndContext } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'
import { DimensionItem } from '../dimension-item'

// Mock Redux store for testing
const mockStore = configureStore({
    reducer: {
        ui: (state = { layout: { dimensions: {} } }) => state,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
})

// Wrapper component to provide DnD context and Redux store
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={mockStore}>
        <DndContext>
            <SortableContext
                items={['test-item']}
                strategy={rectSortingStrategy}
            >
                {children}
            </SortableContext>
        </DndContext>
    </Provider>
)

describe('<DimensionItem />', () => {
    const defaultProps = {
        id: 'test-dimension',
        name: 'Test Dimension',
        dimensionType: 'DATA_ELEMENT' as const,
        valueType: 'TEXT',
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

        cy.get('[data-test="dimension-item-base-Test-Dimension"]').should(
            'be.visible'
        )
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

    it('has an add button when not selected and not disabled', () => {
        cy.mount(
            <TestWrapper>
                <DimensionItem {...defaultProps} />
            </TestWrapper>
        )

        // Verify the button exists but is not visible initially
        cy.get('[data-test="item-menu-button-Test-Dimension"]').should('exist')
        cy.get('[data-test="item-menu-button-Test-Dimension"]').should(
            'not.be.visible'
        )
        cy.get('[data-test="item-menu-button-Test-Dimension"] button').should(
            'exist'
        )
        cy.get('[data-test="add-button-test-dimension"').should('exist')
        cy.get('[data-test="subtract-button-test-dimension"').should(
            'not.exist'
        )
    })

    it('has a subtract button when selected and not disabled', () => {
        cy.mount(
            <TestWrapper>
                <DimensionItem {...defaultProps} selected={true} />
            </TestWrapper>
        )

        // Verify the button exists but is not visible initially
        cy.get('[data-test="item-menu-button-Test-Dimension"]').should('exist')
        cy.get('[data-test="item-menu-button-Test-Dimension"]').should(
            'not.be.visible'
        )
        cy.get('[data-test="item-menu-button-Test-Dimension"] button').should(
            'exist'
        )
        cy.get('[data-test="add-button-test-dimension"').should('not.exist')
        cy.get('[data-test="subtract-button-test-dimension"').should('exist')

        // now hover using cypress realHover
        // cy.get('[data-test="item-menu-button-Test-Dimension"]').realHover()
        // cy.get('[data-test="item-menu-button-Test-Dimension"]').should(
        //     'be.visible'
        // )
        // cy.get('[data-test="item-menu-button-Test-Dimension"] button').should(
        //     'be.visible'
        // )
    })

    it('does not have a menu button when disabled', () => {
        cy.mount(
            <TestWrapper>
                <DimensionItem {...defaultProps} disabled={true} />
            </TestWrapper>
        )

        cy.get('[data-test="item-button-Test-Dimension"]').should('not.exist')
    })

    it('renders with custom draggableId', () => {
        cy.mount(
            <TestWrapper>
                <DimensionItem {...defaultProps} draggableId="custom-drag-id" />
            </TestWrapper>
        )

        cy.get('[data-test="dimension-item-base-Test-Dimension"]').should(
            'be.visible'
        )
    })

    it.skip('has teal-100 background color when selected', () => {
        cy.mount(
            <TestWrapper>
                <DimensionItem {...defaultProps} selected={true} />
            </TestWrapper>
        )

        // Has a teal-100 background color when selected
        cy.get('[data-test="dimension-item-base-Test-Dimension"]').should(
            'have.css',
            'background-color',
            'rgb(224, 242, 241)'
        )
    })

    it('has cursor not-allowed when disabled', () => {
        cy.mount(
            <TestWrapper>
                <DimensionItem {...defaultProps} disabled={true} />
            </TestWrapper>
        )

        // Check that the disabled styling is applied
        cy.get('[data-test="dimension-item-base-Test-Dimension"]').should(
            'have.css',
            'cursor',
            'not-allowed'
        )
    })
})
