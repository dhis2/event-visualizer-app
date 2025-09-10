import { CssVariables } from '@dhis2/ui'
import { configureStore } from '@reduxjs/toolkit'
import React, { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { Axis } from '../axis'
import type { MetadataInput } from '@components/app-wrapper/metadata-helpers'
import {
    MetadataProvider,
    useAddMetadata,
} from '@components/app-wrapper/metadata-provider'
import { visUiConfigSlice, initialState } from '@store/vis-ui-config-slice'

const createTestStore = (preloadedState = {}) => {
    return configureStore({
        reducer: {
            visUiConfig: visUiConfigSlice.reducer,
        },
        preloadedState: {
            visUiConfig: { ...initialState, ...preloadedState },
        },
    })
}

// Mock metadata items for testing
const mockMetadataItems: MetadataInput = [
    {
        uid: 'genderId',
        name: 'Gender',
        dimensionType: 'PROGRAM_ATTRIBUTE',
        valueType: 'TEXT',
    },
    {
        uid: 'mchInfantFeeding',
        name: 'MCH Infant Feeding',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    },
    {
        uid: 'ou',
        name: 'Organisation unit',
        dimensionType: 'ORGANISATION_UNIT',
    },
]

// Component to populate metadata during test setup
const MetadataSetup: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const addMetadata = useAddMetadata()
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        addMetadata(mockMetadataItems)
        setIsLoaded(true)
    }, [addMetadata])

    if (!isLoaded) {
        return null // Don't render children until metadata is loaded
    }

    return <>{children}</>
}

const TestWrapper: React.FC<{
    children: React.ReactNode
    store?: ReturnType<typeof createTestStore>
}> = ({ children, store = createTestStore() }) => (
    <Provider store={store}>
        <MetadataProvider>
            <MetadataSetup>{children}</MetadataSetup>
            <CssVariables colors spacers theme />
        </MetadataProvider>
    </Provider>
)

const reduxVisUiConfigObject = {
    inputType: 'EVENT',
    itemsByDimension: {
        ou: ['someOrgUnitId'],
    },
}

describe('<Axis />', () => {
    it('renders left axis with columns configuration and no dimensions', () => {
        const store = createTestStore(reduxVisUiConfigObject)

        cy.mount(
            <TestWrapper store={store}>
                <Axis axisId="columns" side="left" />
            </TestWrapper>
        )

        cy.getByDataTest('axis-columns-left')
            .should('be.visible')
            .and('have.css', 'flex-basis', '65%')

        cy.contains('Columns').should('be.visible')

        // No chips should be rendered when no dimensionIds provided
        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })

    it('renders left axis with columns with dimensions', () => {
        const store = createTestStore(reduxVisUiConfigObject)

        cy.mount(
            <TestWrapper store={store}>
                <Axis
                    axisId="columns"
                    dimensionIds={['ou', 'genderId']}
                    side="left"
                />
            </TestWrapper>
        )

        // left side is 65% width
        cy.getByDataTest('axis-columns-left')
            .should('be.visible')
            .and('have.css', 'flex-basis', '65%')

        cy.getByDataTest('axis-columns-left').should('be.visible')
        cy.contains('Columns').should('be.visible')

        cy.getByDataTest('layout-dimension-chip').should('have.length', 2)
        cy.contains('Organisation unit').should('be.visible')
        cy.contains('Gender').should('be.visible')
        cy.contains('MCH Infant Feeding').should('not.exist')
    })

    it('renders right axis with filters with no dimensions', () => {
        const store = createTestStore(reduxVisUiConfigObject)

        cy.mount(
            <TestWrapper store={store}>
                <Axis axisId="filters" side="right" />
            </TestWrapper>
        )

        // right side is 35% width
        cy.getByDataTest('axis-filters-right')
            .should('be.visible')
            .and('have.css', 'flex-basis', '35%')

        cy.contains('Filter').should('be.visible')

        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })

    it('renders right axis with filters with dimensions', () => {
        const store = createTestStore(reduxVisUiConfigObject)

        cy.mount(
            <TestWrapper store={store}>
                <Axis
                    axisId="filters"
                    dimensionIds={['ou', 'mchInfantFeeding']}
                    side="right"
                />
            </TestWrapper>
        )

        cy.getByDataTest('axis-filters-right')
            .should('be.visible')
            .and('have.css', 'flex-basis', '35%')

        cy.getByDataTest('layout-dimension-chip').should('have.length', 2)
        cy.contains('Organisation unit').should('be.visible')
        cy.contains('MCH Infant Feeding').should('be.visible')
        cy.contains('Gender').should('not.exist')
    })

    it('handles empty dimenssionIds array', () => {
        const store = createTestStore(reduxVisUiConfigObject)

        cy.mount(
            <TestWrapper store={store}>
                <Axis axisId="columns" dimensionIds={[]} side="left" />
            </TestWrapper>
        )

        cy.getByDataTest('axis-columns-left').should('be.visible')
        cy.contains('Columns').should('be.visible')
        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })
})
