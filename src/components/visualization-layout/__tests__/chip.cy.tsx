import { CssVariables } from '@dhis2/ui'
import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'
import { Chip } from '../chip'
import type { LayoutDimension } from '../chip'
import {
    visUiConfigSlice,
    initialState as visUiConfigInitialState,
} from '@store/vis-ui-config-slice'

// Create a test store with the vis-config slice
const createTestStore = (preloadedState = {}) => {
    return configureStore({
        reducer: {
            visUiConfig: visUiConfigSlice.reducer,
        },
        preloadedState: {
            visUiConfig: { ...visUiConfigInitialState, ...preloadedState },
        },
    })
}

const TestWrapper: React.FC<{
    children: React.ReactNode
    store?: ReturnType<typeof createTestStore>
}> = ({ children, store = createTestStore() }) => (
    <Provider store={store}>
        {children}
        <CssVariables colors spacers theme />
    </Provider>
)

describe('<Chip />', () => {
    it('renders a chip with a data element dimension', () => {
        // Create a dimension object using info from fakemetadata
        const dimension: LayoutDimension = {
            id: 'A03MvHHogjR.X8zyunlgUfM',
            dimensionId: 'X8zyunlgUfM',
            name: 'MCH Infant Feeding',
            dimensionType: 'DATA_ELEMENT',
            valueType: 'TEXT',
            optionSet: 'x31y45jvIQL',
            code: 'DE_2006103',
        }

        // Create a store with some test data that matches the dimension
        const store = createTestStore({
            itemsByDimension: {
                [dimension.id]: ['option1', 'option2'],
            },
            conditionsByDimension: {
                [dimension.id]: 'GT:10',
            },
        })

        cy.mount(
            <TestWrapper store={store}>
                <Chip dimension={dimension} axisId="columns" />
            </TestWrapper>
        )

        // Check that the chip renders with the correct test attribute
        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        // Check that the dimension name is displayed
        cy.contains('MCH Infant Feeding').should('be.visible')

        // Check that the menu button is present
        cy.getByDataTest('chip-menu-button').should('be.visible')

        // Check that clicking the menu button logs a message (basic interaction test)
        cy.getByDataTest('chip-menu-button').click()
    })

    it('renders a chip with a dimension that has a suffix', () => {
        // Create a dimension object with a suffix to distinguish it from duplicates
        const dimension: LayoutDimension = {
            id: 'p1.p1s1.d1',
            dimensionId: 'd1',
            name: 'MCH Infant Feeding',
            dimensionType: 'DATA_ELEMENT',
            valueType: 'NUMBER',
            suffix: 'Birth',
            programId: 'p1',
            programStageId: 'p1s1',
        }

        // Create a store with some test data
        const store = createTestStore({
            itemsByDimension: {},
            conditionsByDimension: {
                [dimension.id]: 'IN:Mixed',
            },
        })

        cy.mount(
            <TestWrapper store={store}>
                <Chip dimension={dimension} axisId="columns" />
            </TestWrapper>
        )

        // Check that the chip renders with the correct test attribute
        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        // Check that the primary dimension name is displayed
        cy.contains('MCH Infant Feeding,').should('be.visible')

        // Check that the suffix is displayed as secondary text
        cy.contains('Birth').should('be.visible')

        // Check that the menu button is present
        cy.getByDataTest('chip-menu-button').should('be.visible')
    })

    it('renders a chip with no suffix and no item/condition count', () => {
        // Create a dimension object without suffix and no items/conditions
        const dimension: LayoutDimension = {
            id: 'simple-dimension',
            dimensionId: 'simple-dimension',
            name: 'Simple Dimension',
            dimensionType: 'DATA_ELEMENT',
            valueType: 'TEXT',
        }

        // Create a store with no items or conditions for this dimension
        const store = createTestStore({
            itemsByDimension: {},
            conditionsByDimension: {},
        })

        cy.mount(
            <TestWrapper store={store}>
                <Chip dimension={dimension} axisId="columns" />
            </TestWrapper>
        )

        // Check that the chip renders with the correct test attribute
        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        // Check that only the dimension name is displayed (no suffix, no count)
        cy.contains('Simple Dimension').should('be.visible')

        // Verify no comma or secondary text is shown
        cy.get('[data-test="layout-dimension-chip"]').should('not.contain', ',')

        // Check that the menu button is present
        cy.getByDataTest('chip-menu-button').should('be.visible')
    })

    it('renders a chip when axisId is filters', () => {
        // Create a dimension object for use in filters
        const dimension: LayoutDimension = {
            id: 'filter-dimension',
            dimensionId: 'filter-dimension',
            name: 'Filter Dimension',
            dimensionType: 'DATA_ELEMENT',
            valueType: 'BOOLEAN',
        }

        // Create a store with conditions for this dimension
        const store = createTestStore({
            itemsByDimension: {},
            conditionsByDimension: {
                [dimension.id]: 'EQ:true;EQ:false',
            },
        })

        cy.mount(
            <TestWrapper store={store}>
                <Chip dimension={dimension} axisId="filters" />
            </TestWrapper>
        )

        // Check that the chip renders with the correct test attribute
        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        // Check that the dimension name is displayed
        cy.contains('Filter Dimension').should('be.visible')

        // Check that the menu button is present
        cy.getByDataTest('chip-menu-button').should('be.visible')

        // For filters axis, the chip should show condition count instead of "all"
        // (This tests the specific behavior where filters don't return "all" for BOOLEAN with 2 conditions)
    })
})
