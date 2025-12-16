import { useDraggable } from '@dnd-kit/core'
import { LayoutPanel } from '../layout-panel'
import chipEndClasses from '../styles/chip-end.module.css'
import chipClasses from '../styles/chip.module.css'
import emptyAxisClasses from '../styles/empty-axis-drop-area.module.css'
import insertMarkerClasses from '../styles/insert-marker.module.css'
import { uiSlice, initialState as uiSliceInitialState } from '@store/ui-slice'
import {
    visUiConfigSlice,
    initialState as visUiConfigInitialState,
} from '@store/vis-ui-config-slice'
import { MockAppWrapper, type MockOptions } from '@test-utils/app-wrapper'

const mockOptions: MockOptions = {
    metadata: {
        genderId: {
            uid: 'genderId',
            name: 'Gender',
            dimensionType: 'PROGRAM_ATTRIBUTE',
            valueType: 'TEXT',
        },
        mchInfantFeeding: {
            uid: 'mchInfantFeeding',
            name: 'MCH Infant Feeding',
            dimensionType: 'DATA_ELEMENT',
            valueType: 'TEXT',
        },
        mchNutrition: {
            uid: 'mchNutrition',
            name: 'MCH Nutrition',
            dimensionType: 'DATA_ELEMENT',
            valueType: 'TEXT',
        },
        ou: {
            uid: 'ou',
            name: 'Organisation unit',
            dimensionType: 'ORGANISATION_UNIT',
        },
        ageAtVisit: {
            uid: 'ageAtVisit',
            name: 'Age at visit',
            dimensionType: 'PROGRAM_ATTRIBUTE',
            valueType: 'NUMBER',
        },
    },
    partialStore: {
        reducer: {
            ui: uiSlice.reducer,
            visUiConfig: visUiConfigSlice.reducer,
        },
        preloadedState: {
            ui: uiSliceInitialState,
            visUiConfig: {
                ...visUiConfigInitialState,
                visualizationType: 'LINE_LIST',
                outputType: 'EVENT',
                layout: {
                    columns: ['ou', 'mchInfantFeeding', 'ageAtVisit'],
                    filters: ['genderId', 'mchNutrition'],
                    rows: [],
                },
                itemsByDimension: {
                    ou: ['orgUnit1'],
                },
                conditionsByDimension: {
                    genderId: {
                        condition: 'EQ:male',
                    },
                },
            },
        },
    },
}

const baseVisUiConfig =
    mockOptions.partialStore?.preloadedState.visUiConfig ??
    visUiConfigInitialState

const buildMockOptions = (
    visOverrides?: Partial<typeof baseVisUiConfig>
): MockOptions => ({
    ...mockOptions,
    partialStore: {
        ...mockOptions.partialStore!,
        preloadedState: {
            ...mockOptions.partialStore!.preloadedState,
            visUiConfig: {
                ...baseVisUiConfig,
                ...visOverrides,
                layout: {
                    ...baseVisUiConfig.layout,
                    ...visOverrides?.layout,
                },
            },
        },
    },
})

const getChipContent = (dimensionId: string) =>
    cy
        .getByDataTest(`layout-dimension-dnd-${dimensionId}`)
        .find(`.${chipClasses.content}`)

const SidebarDimension = ({
    dimensionId,
    label,
}: {
    dimensionId: string
    label: string
}) => {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: `sidebar-${dimensionId}`,
        data: { dimensionId },
    })

    return (
        <button
            type="button"
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            data-test={`sidebar-dimension-${dimensionId}`}
        >
            {label}
        </button>
    )
}

describe('<LayoutPanel />', () => {
    it('renders with LINE_LIST visualization type, EVENT input type, 3 column chips and 2 filter chips', () => {
        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <LayoutPanel />
            </MockAppWrapper>
        )

        // Check that 2 groups are rendered
        cy.get('[class*="columns"]').should('be.visible')
        cy.get('[class*="filters"]').should('be.visible')

        // Check that both axes are rendered
        cy.getByDataTest('axis-columns').should('be.visible')
        cy.getByDataTest('axis-filters').should('be.visible')

        // Check axis labels
        cy.getByDataTest('axis-columns')
            .contains('Columns')
            .should('be.visible')
        cy.getByDataTest('axis-filters').contains('Filter').should('be.visible')

        // Verify columns axis has 3 chips
        cy.getByDataTest('axis-columns')
            .findByDataTest('layout-dimension-chip')
            .should('have.length', 3)

        // Verify filters axis has 2 chips
        cy.getByDataTest('axis-filters')
            .findByDataTest('layout-dimension-chip')
            .should('have.length', 2)

        // Check that the correct dimension names are displayed
        cy.contains('Gender').should('be.visible')
        cy.contains('MCH Infant Feeding').should('be.visible')
        cy.contains('Organisation unit').should('be.visible')
        cy.contains('Age at visit').should('be.visible')
        cy.contains('MCH Nutrition').should('be.visible')

        // Verify the chips are in the correct axes
        cy.getByDataTest('axis-columns').within(() => {
            cy.contains('Organisation unit').should('be.visible')
            cy.contains('MCH Infant Feeding').should('be.visible')
            cy.contains('Age at visit').should('be.visible')
        })

        cy.getByDataTest('axis-filters').within(() => {
            cy.contains('Gender').should('be.visible')
            cy.contains('MCH Nutrition').should('be.visible')
        })
    })

    it('allows dragging a chip from filters to columns', () => {
        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <LayoutPanel />
            </MockAppWrapper>
        )

        cy.getByDataTest('layout-dimension-dnd-ou')
            .realMouseDown({ position: 'center' })
            .realMouseMove(30, 30) // exceed activation
        cy.getByDataTest('axis-content-filters').realMouseMove(10, 10, {
            position: 'center',
        })
        cy.get('body').realMouseUp()

        cy.getByDataTest('axis-content-filters').within(() => {
            cy.getByDataTest('layout-dimension-dnd-ou').should('be.visible')
        })
    })

    it('shows the insert marker when hovering a chip on another axis and toggles insertAfter at the chip end', () => {
        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <LayoutPanel />
            </MockAppWrapper>
        )

        cy.getByDataTest('layout-dimension-dnd-genderId')
            .realMouseDown({ position: 'center' })
            .realMouseMove(35, 0)

        cy.getByDataTest('layout-dimension-dnd-mchInfantFeeding').realMouseMove(
            0,
            0,
            { position: 'center' }
        )

        getChipContent('mchInfantFeeding').should(
            'have.class',
            insertMarkerClasses.withInsertMarker
        )
        getChipContent('mchInfantFeeding').should(
            'not.have.class',
            insertMarkerClasses.atEnd
        )

        cy.getByDataTest('layout-dimension-dnd-mchInfantFeeding')
            .find(`.${chipEndClasses.container}`)
            .should('exist')
            .realMouseMove(0, 0, { position: 'center' })

        getChipContent('mchInfantFeeding').should(
            'have.class',
            insertMarkerClasses.atEnd
        )
        cy.get('body').realMouseUp()
    })

    it('suppresses the insert marker when hovering the immediate neighbor on the same axis and reappears for non-adjacent chips', () => {
        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <LayoutPanel />
            </MockAppWrapper>
        )

        cy.getByDataTest('layout-dimension-dnd-ou')
            .realMouseDown({ position: 'center' })
            .realMouseMove(40, 0)

        cy.getByDataTest('layout-dimension-dnd-mchInfantFeeding').realMouseMove(
            0,
            0,
            { position: 'center' }
        )

        getChipContent('mchInfantFeeding').should(
            'not.have.class',
            insertMarkerClasses.withInsertMarker
        )

        cy.getByDataTest('layout-dimension-dnd-ageAtVisit').realMouseMove(
            0,
            0,
            { position: 'center' }
        )

        getChipContent('ageAtVisit').should(
            'have.class',
            insertMarkerClasses.withInsertMarker
        )
        cy.get('body').realMouseUp()
    })

    it('hides the insert marker when hovering the dragged chip itself', () => {
        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <LayoutPanel />
            </MockAppWrapper>
        )

        const chip = cy.getByDataTest('layout-dimension-dnd-mchInfantFeeding')

        chip.realMouseDown({ position: 'center' }).realMouseMove(35, 0)
        chip.realMouseMove(0, 0, { position: 'center' })

        getChipContent('mchInfantFeeding').should(
            'not.have.class',
            insertMarkerClasses.withInsertMarker
        )

        cy.get('body').realMouseUp()
    })

    it('shows the insert marker when hovering an empty rows axis', () => {
        const pivotOptions = buildMockOptions({
            visualizationType: 'PIVOT_TABLE',
        })

        cy.mount(
            <MockAppWrapper {...pivotOptions}>
                <LayoutPanel />
            </MockAppWrapper>
        )

        cy.getByDataTest('layout-dimension-dnd-genderId')
            .realMouseDown({ position: 'center' })
            .realMouseMove(35, 0)

        cy.getByDataTest('axis-content-rows').realMouseMove(0, 0, {
            position: 'center',
        })

        cy.getByDataTest('axis-content-rows')
            .find(`.${emptyAxisClasses.markerAnchor}`)
            .should('have.class', insertMarkerClasses.withInsertMarker)

        cy.get('body').realMouseUp()
    })

    it('shows the insert marker when dragging a sidebar dimension onto an axis', () => {
        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <>
                    <SidebarDimension
                        dimensionId="mchNutrition"
                        label="MCH Nutrition"
                    />
                    <LayoutPanel />
                </>
            </MockAppWrapper>
        )

        cy.getByDataTest('sidebar-dimension-mchNutrition')
            .realMouseDown({ position: 'center' })
            .realMouseMove(35, 0)

        cy.getByDataTest('layout-dimension-dnd-ageAtVisit').realMouseMove(
            0,
            0,
            { position: 'center' }
        )

        getChipContent('ageAtVisit').should(
            'have.class',
            insertMarkerClasses.withInsertMarker
        )

        cy.get('body').realMouseUp()
    })
})
