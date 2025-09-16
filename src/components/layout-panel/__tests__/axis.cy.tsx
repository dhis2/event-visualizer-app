import { CssVariables } from '@dhis2/ui'
import type { Store } from '@reduxjs/toolkit'
import React, { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { Axis } from '../axis'
import type { MetadataInput } from '@components/app-wrapper/metadata-helpers'
import {
    MetadataProvider,
    useAddMetadata,
} from '@components/app-wrapper/metadata-provider'
import { visUiConfigSlice, initialState } from '@store/vis-ui-config-slice'
import { setupStore } from '@test-utils/setup-store'
import type { RootState } from '@types'

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
    store: ReturnType<typeof setupStore> & {
        getState: () => Partial<RootState>
    }
}> = ({ children, store }) => (
    <Provider store={store as Store}>
        <MetadataProvider>
            <MetadataSetup>{children}</MetadataSetup>
            <CssVariables colors spacers theme />
        </MetadataProvider>
    </Provider>
)

describe('<Axis />', () => {
    let store: ReturnType<typeof setupStore> & {
        getState: () => Partial<RootState>
    }

    beforeEach(() => {
        if (!store) {
            store = setupStore(
                { visUiConfig: visUiConfigSlice.reducer },
                {
                    visUiConfig: {
                        ...initialState,
                        itemsByDimension: {
                            ou: ['someOrgUnitId'],
                        },
                    },
                }
            )
        }
    })
    it('renders start axis with columns configuration and no dimensions', () => {
        cy.mount(
            <TestWrapper store={store}>
                <Axis axisId="columns" position="start" />
            </TestWrapper>
        )

        cy.getByDataTest('axis-columns-start')
            .should('be.visible')
            .and('have.css', 'flex-basis', '65%')

        cy.contains('Columns').should('be.visible')

        // No chips should be rendered when no dimensionIds provided
        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })

    it('renders start axis with columns with dimensions', () => {
        cy.mount(
            <TestWrapper store={store}>
                <Axis
                    axisId="columns"
                    dimensionIds={['ou', 'genderId']}
                    position="start"
                />
            </TestWrapper>
        )

        // start position is 65% width
        cy.getByDataTest('axis-columns-start')
            .should('be.visible')
            .and('have.css', 'flex-basis', '65%')

        cy.getByDataTest('axis-columns-start').should('be.visible')
        cy.contains('Columns').should('be.visible')

        cy.getByDataTest('layout-dimension-chip').should('have.length', 2)
        cy.contains('Organisation unit').should('be.visible')
        cy.contains('Gender').should('be.visible')
        cy.contains('MCH Infant Feeding').should('not.exist')
    })

    it('renders end axis with filters with no dimensions', () => {
        cy.mount(
            <TestWrapper store={store}>
                <Axis axisId="filters" position="end" />
            </TestWrapper>
        )

        // end position is 35% width
        cy.getByDataTest('axis-filters-end')
            .should('be.visible')
            .and('have.css', 'flex-basis', '35%')

        cy.contains('Filter').should('be.visible')

        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })

    it('renders end axis with filters with dimensions', () => {
        cy.mount(
            <TestWrapper store={store}>
                <Axis
                    axisId="filters"
                    dimensionIds={['ou', 'mchInfantFeeding']}
                    position="end"
                />
            </TestWrapper>
        )

        cy.getByDataTest('axis-filters-end')
            .should('be.visible')
            .and('have.css', 'flex-basis', '35%')

        cy.getByDataTest('layout-dimension-chip').should('have.length', 2)
        cy.contains('Organisation unit').should('be.visible')
        cy.contains('MCH Infant Feeding').should('be.visible')
        cy.contains('Gender').should('not.exist')
    })

    it('handles empty dimenssionIds array', () => {
        cy.mount(
            <TestWrapper store={store}>
                <Axis axisId="columns" dimensionIds={[]} position="start" />
            </TestWrapper>
        )

        cy.getByDataTest('axis-columns-start').should('be.visible')
        cy.contains('Columns').should('be.visible')
        cy.getByDataTest('layout-dimension-chip').should('have.length', 0)
    })
})
