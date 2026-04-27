import { Axis } from '@components/layout-panel/axis/axis'
import { CssVariables } from '@dhis2/ui'
import { useAppSelector } from '@hooks'
import {
    getVisUiConfigLayout,
    initialState as visUiConfigInitialState,
} from '@store/vis-ui-config-slice'
import { MockAppWrapper } from '@test-utils/app-wrapper'
import type { DimensionMetadataItem } from '@types'
import type React from 'react'
import { DraggableDimensionItem } from '../draggable-dimension-item'

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

const SidebarAndLayout = () => {
    const layout = useAppSelector(getVisUiConfigLayout)

    return (
        <>
            <DraggableDimensionItem dimension={testDimension} />
            <Axis axisId="columns" dimensionIds={layout.columns} />
            <Axis axisId="rows" dimensionIds={layout.rows} />
        </>
    )
}

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

        cy.getByDataTest('dimension-item').should('be.visible').realHover()

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

        cy.getByDataTest('dimension-item')
            .parent()
            .parent()
            .should('have.css', 'cursor', 'not-allowed')
    })

    it('adds a clicked sidebar item to the layout and opens the layout popover', () => {
        cy.mount(
            <TestWrapper>
                <SidebarAndLayout />
            </TestWrapper>
        )

        cy.getByDataTest('dimension-item').click()

        cy.getByDataTest('axis-content-columns')
            .findByDataTest('layout-dimension-chip')
            .should('contain.text', 'Test Dimension')
        cy.getByDataTest('dimension-popover').should('be.visible')
    })

    it('opens the layout popover when the clicked sidebar item is already in the layout', () => {
        cy.mount(
            <MockAppWrapper
                metadata={{ [testDimension.id]: testDimension }}
                partialStore={{
                    preloadedState: {
                        visUiConfig: {
                            ...visUiConfigInitialState,
                            layout: {
                                columns: [],
                                rows: [testDimension.id],
                                filters: [],
                            },
                        },
                    },
                }}
            >
                <SidebarAndLayout />
            </MockAppWrapper>
        )

        cy.getByDataTest('dimension-item').click()

        cy.getByDataTest('axis-content-rows')
            .findByDataTest('layout-dimension-chip')
            .should('contain.text', 'Test Dimension')
        cy.getByDataTest('dimension-popover').should('be.visible')
    })
})
