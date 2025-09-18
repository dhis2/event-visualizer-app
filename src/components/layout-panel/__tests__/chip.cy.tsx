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

// Create a test store with the vis-ui-config slice
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
        const dimension: LayoutDimension = {
            id: 'ou',
            dimensionType: 'ORGANISATION_UNIT',
            name: 'Organisation unit',
            dimensionId: 'ou',
            programStageId: '',
        }

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

        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        cy.contains('Organisation unit').should('be.visible')

        cy.getByDataTest('chip-menu-button').should('be.visible')

        cy.getByDataTest('chip-items').should('contain.text', '2')

        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            'rgb(224, 242, 241)' // teal-100
        )
    })

    it('renders a data element chip in columns that has a suffix and no items or conditions', () => {
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
            conditionsByDimension: {},
        })

        cy.mount(
            <TestWrapper store={store}>
                <Chip dimension={dimension} axisId="columns" />
            </TestWrapper>
        )

        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        cy.contains('MCH Infant Feeding,').should('be.visible')

        cy.contains('Baby Postnatal').should('be.visible')

        cy.getByDataTest('chip-items').should('contain.text', 'all')

        cy.getByDataTest('chip-menu-button').should('be.visible')
    })

    // TODO: enable when https://dhis2.atlassian.net/browse/DHIS2-20105 is implemented
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

        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        cy.contains('MCH Infant Feeding,').should('be.visible')

        cy.contains('Baby Postnatal').should('be.visible')

        cy.getByDataTest('chip-items').should('contain.text', '2')

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

        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        cy.contains('Program status').should('be.visible')

        cy.getByDataTest('chip-items').should('contain.text', '2')

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

        const store = createTestStore({
            itemsByDimension: {},
            conditionsByDimension: {},
        })

        cy.mount(
            <TestWrapper store={store}>
                <Chip dimension={dimension} axisId="filters" />
            </TestWrapper>
        )

        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        cy.contains('Gender').should('be.visible')

        cy.get('[data-test="layout-dimension-chip"]').should('not.contain', ',')

        cy.getByDataTest('chip-items').should('not.be.visible')

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

        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        cy.contains('Program status').should('be.visible')

        cy.getByDataTest('chip-items').should('contain.text', '2')

        cy.getByDataTest('chip-menu-button').should('be.visible')

        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            'rgb(224, 242, 241)' // teal-100
        )
    })

    // TODO: enable when https://dhis2.atlassian.net/browse/DHIS2-20105 is implemented
    it.skip('renders a chip in filters with condition counts', () => {
        const dimension: LayoutDimension = {
            id: 'cejWyOfXge6',
            name: 'Gender',
            dimensionType: 'PROGRAM_ATTRIBUTE',
            valueType: 'TEXT',
            optionSet: 'pC3N9N77UmT',
            dimensionId: 'cejWyOfXge6',
            programStageId: '',
        }

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

        cy.getByDataTest('layout-dimension-chip').should('be.visible')

        cy.contains('Gender').should('be.visible')

        cy.getByDataTest('chip-menu-button').should('be.visible')

        cy.getByDataTest('chip-items').should('contain.text', '1')

        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            'rgb(224, 242, 241)' // teal-100
        )
    })
})
