import { CssVariables } from '@dhis2/ui'
import { configureStore } from '@reduxjs/toolkit'
import React, { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { LineListLayout } from '../line-list-layout'
import type { MetadataInput } from '@components/app-wrapper/metadata-helpers'
import {
    MetadataProvider,
    useAddMetadata,
} from '@components/app-wrapper/metadata-provider'
import { visUiConfigSlice, initialState } from '@store/vis-ui-config-slice'

// Create a test store with the vis-ui-config slice
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

describe('<LineListLayout />', () => {
    it('renders with LINE_LIST visualization type, EVENT input type, 2 column chips and 1 filter chip', () => {
        const store = createTestStore({
            visualizationType: 'LINE_LIST',
            inputType: 'EVENT',
            layout: {
                columns: ['ou', 'mchInfantFeeding'], // 2 dimensions for columns
                filters: ['genderId'], // 1 dimension for filters
                rows: [],
            },
            itemsByDimension: {
                ou: ['orgUnit1'],
            },
            conditionsByDimension: {
                condition: {
                    genderId: 'IN:male',
                },
            },
        })

        cy.mount(
            <TestWrapper store={store}>
                <LineListLayout />
            </TestWrapper>
        )

        // Check that the layout container is rendered
        cy.get('[class*="layoutContainer"]').should('be.visible')

        // Check that both axes are rendered
        cy.getByDataTest('axis-columns-left').should('be.visible')
        cy.getByDataTest('axis-filters-right').should('be.visible')

        // Check axis labels
        cy.getByDataTest('axis-columns-left')
            .contains('Columns')
            .should('be.visible')
        cy.getByDataTest('axis-filters-right')
            .contains('Filter')
            .should('be.visible')

        // Verify columns axis has 2 chips
        cy.getByDataTest('axis-columns-left')
            .find('[data-test="layout-dimension-chip"]')
            .should('have.length', 2)

        // Verify filters axis has 1 chip
        cy.getByDataTest('axis-filters-right')
            .find('[data-test="layout-dimension-chip"]')
            .should('have.length', 1)

        // Check that the correct dimension names are displayed
        cy.contains('Gender').should('be.visible')
        cy.contains('MCH Infant Feeding').should('be.visible')
        cy.contains('Organisation unit').should('be.visible')

        // Verify the chips are in the correct axes
        cy.getByDataTest('axis-columns-left').within(() => {
            cy.contains('Organisation unit').should('be.visible')
            cy.contains('MCH Infant Feeding').should('be.visible')
        })

        cy.getByDataTest('axis-filters-right').within(() => {
            cy.contains('Gender').should('be.visible')
        })
    })
})
