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
    it('renders an org unit chip in columns with 2 org units set', () => {
        // Create a dimension object using info from fakemetadata
        const dimension: LayoutDimension = {
            id: 'ou',
            dimensionType: 'ORGANISATION_UNIT',
            name: 'Organisation unit',
            dimensionId: 'ou',
            programStageId: '',
        }

        // Create a store with some test data that matches the dimension
        const store = createTestStore({
            itemsByDimension: {
                [dimension.id]: ['ou1', 'ou2'],
            },
            conditionsByDimension: {},
        })

        cy.mount(
            <TestWrapper store={store}>
                <Chip dimension={dimension} axisId="columns" />
            </TestWrapper>
        )

        // Check that the chip renders with the correct test attribute
        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        // Check that the dimension name is displayed
        cy.contains('Organisation unit').should('be.visible')

        // Check that the menu button is present
        cy.getByDataTest('chip-menu-button').should('be.visible')

        cy.getByDataTest('chip-items').should('contain.text', '2')

        // check the background color of the chip
        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            'rgb(224, 242, 241)' // teal-100
        )

        // Check that clicking the menu button logs a message (basic interaction test)
        cy.getByDataTest('chip-menu-button').click()
    })

    it('renders a data element chip in columns that has a suffix and no items or conditions', () => {
        // Create a dimension object with a suffix to distinguish it from duplicates
        const dimension: LayoutDimension = {
            id: 'ZzYYXq4fJie.X8zyunlgUfM',
            name: 'MCH Infant Feeding',
            dimensionType: 'DATA_ELEMENT',
            valueType: 'TEXT',
            optionSet: 'x31y45jvIQL',
            dimensionId: 'X8zyunlgUfM',
            programStageId: 'ZzYYXq4fJie',
            suffix: 'Baby Postnatal',
        }

        // Create a store with some test data
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

        // Check that the primary dimension name is displayed
        cy.contains('MCH Infant Feeding,').should('be.visible')

        // Check that the suffix is displayed as secondary text
        cy.contains('Baby Postnatal').should('be.visible')

        cy.getByDataTest('chip-items').should('contain.text', 'all')

        // Check that the menu button is present
        cy.getByDataTest('chip-menu-button').should('be.visible')
    })

    // TODO - implement conditions counts
    it.skip('renders a chip in columns that has a suffix and has conditions', () => {
        const dimension: LayoutDimension = {
            id: 'ZzYYXq4fJie.X8zyunlgUfM',
            name: 'MCH Infant Feeding',
            dimensionType: 'DATA_ELEMENT',
            valueType: 'TEXT',
            optionSet: 'x31y45jvIQL',
            dimensionId: 'X8zyunlgUfM',
            programStageId: 'ZzYYXq4fJie',
            suffix: 'Baby Postnatal',
        }

        const store = createTestStore({
            itemsByDimension: {},
            conditionsByDimension: {
                'ZzYYXq4fJie.X8zyunlgUfM': { condition: 'IN:Mixed;Exclusive' },
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
        cy.contains('Baby Postnatal').should('be.visible')

        cy.getByDataTest('chip-items').should('contain.text', '2')

        // Check that the menu button is present
        cy.getByDataTest('chip-menu-button').should('be.visible')
    })

    it('renders a chip in columns that has items', () => {
        const dimension: LayoutDimension = {
            id: 'programStatus',
            dimensionType: 'STATUS',
            name: 'Program status',
            dimensionId: 'programStatus',
            programStageId: '',
        }

        const store = createTestStore({
            itemsByDimension: { programStatus: ['ACTIVE', 'COMPLETED'] },
            conditionsByDimension: {},
        })

        cy.mount(
            <TestWrapper store={store}>
                <Chip dimension={dimension} axisId="columns" />
            </TestWrapper>
        )

        // Check that the chip renders with the correct test attribute
        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        // Check that the primary dimension name is displayed
        cy.contains('Program status').should('be.visible')

        cy.getByDataTest('chip-items').should('contain.text', '2')

        // Check that the menu button is present
        cy.getByDataTest('chip-menu-button').should('be.visible')
    })

    it('renders a chip in filters with no suffix and no items or conditions', () => {
        const dimension: LayoutDimension = {
            id: 'cejWyOfXge6',
            name: 'Gender',
            dimensionType: 'PROGRAM_ATTRIBUTE',
            valueType: 'TEXT',
            optionSet: 'pC3N9N77UmT',
            dimensionId: 'cejWyOfXge6',
            programStageId: '',
        }

        // Create a store with no items or conditions for this dimension
        const store = createTestStore({
            itemsByDimension: {},
            conditionsByDimension: {},
        })

        cy.mount(
            <TestWrapper store={store}>
                <Chip dimension={dimension} axisId="filters" />
            </TestWrapper>
        )

        // Check that the chip renders with the correct test attribute
        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        // Check that only the dimension name is displayed (no suffix, no count)
        cy.contains('Gender').should('be.visible')

        // Verify no comma or secondary text is shown
        cy.get('[data-test="layout-dimension-chip"]').should('not.contain', ',')

        cy.getByDataTest('chip-items').should('not.exist')

        // Check that the menu button is present
        cy.getByDataTest('chip-menu-button').should('be.visible')

        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            'rgb(248, 249, 250)' // grey-100
        )
    })

    it('renders a chip in filters that has items', () => {
        const dimension: LayoutDimension = {
            id: 'programStatus',
            dimensionType: 'STATUS',
            name: 'Program status',
            dimensionId: 'programStatus',
            programStageId: '',
        }

        const store = createTestStore({
            itemsByDimension: { programStatus: ['ACTIVE', 'COMPLETED'] },
            conditionsByDimension: {},
        })

        cy.mount(
            <TestWrapper store={store}>
                <Chip dimension={dimension} axisId="filters" />
            </TestWrapper>
        )

        // Check that the chip renders with the correct test attribute
        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        // Check that the primary dimension name is displayed
        cy.contains('Program status').should('be.visible')

        cy.getByDataTest('chip-items').should('contain.text', '2')

        // Check that the menu button is present
        cy.getByDataTest('chip-menu-button').should('be.visible')

        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            'rgb(224, 242, 241)' // teal-100
        )
    })

    it.skip('renders a chip in filters with condition counts', () => {
        // Create a dimension object for use in filters with items and conditions
        const dimension: LayoutDimension = {
            id: 'cejWyOfXge6',
            name: 'Gender',
            dimensionType: 'PROGRAM_ATTRIBUTE',
            valueType: 'TEXT',
            optionSet: 'pC3N9N77UmT',
            dimensionId: 'cejWyOfXge6',
            programStageId: '',
        }

        // Create a store with both items and conditions for this dimension
        const store = createTestStore({
            itemsByDimension: {},
            conditionsByDimension: {
                [dimension.id]: { condition: 'IN:male' },
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
        cy.contains('Gender').should('be.visible')

        // Check that the menu button is present
        cy.getByDataTest('chip-menu-button').should('be.visible')

        // The chip should show the item count (3)
        cy.getByDataTest('chip-items').should('contain.text', '1')

        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            'rgb(224, 242, 241)' // teal-100
        )
    })
})
