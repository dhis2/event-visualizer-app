import { logger } from '@modules/logger'
import {
    currentVisSlice,
    initialState as currentVisSliceInitialState,
} from '@store/current-vis-slice'
import {
    dimensionSelectionSlice,
    initialState as dimensionSelectionInitialState,
} from '@store/dimensions-selection-slice'
import {
    loaderSlice,
    initialState as loaderSliceInitialState,
} from '@store/loader-slice'
import {
    uiSlice,
    initialState as uiSliceInitialState,
    type LayoutPanelHeight,
} from '@store/ui-slice'
import {
    visUiConfigSlice,
    initialState as visUiConfigInitialState,
} from '@store/vis-ui-config-slice'
import { MockAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { LayoutPanel } from '../layout-panel'

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
            currentVis: currentVisSlice.reducer,
            dimensionSelection: dimensionSelectionSlice.reducer,
            loader: loaderSlice.reducer,
            ui: uiSlice.reducer,
            visUiConfig: visUiConfigSlice.reducer,
        },
        preloadedState: {
            currentVis: currentVisSliceInitialState,
            dimensionSelection: dimensionSelectionInitialState,
            loader: loaderSliceInitialState,
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

const createMockOptions = (
    preloadedState = {},
    metadata = {}
): MockOptions => ({
    metadata: {
        ...mockOptions.metadata,
        ...metadata,
    },
    partialStore: {
        reducer: mockOptions.partialStore?.reducer,
        preloadedState: {
            ...mockOptions.partialStore?.preloadedState,
            ...preloadedState,
        },
    },
})

describe('<LayoutPanel />', () => {
    it('renders with LINE_LIST visualization type, and empty axes when no data source is selected', () => {
        cy.mount(
            <MockAppWrapper {...mockOptions}>
                <LayoutPanel />
            </MockAppWrapper>
        )

        // Check that the visu type selector is visible
        cy.getByDataTest('visualization-type-selector-button').should(
            'be.visible'
        )

        // Check that the options button is visible
        cy.getByDataTest('visualization-options-button').should('be.visible')

        // Check that the expand layout toggle is not present
        cy.getByDataTest('expand-layout-panel-toggle').should('not.exist')

        // Check that 2 groups are not rendered
        cy.get('[class*="columns"]').should('not.exist')
        cy.get('[class*="filters"]').should('not.exist')

        // Check that both axes are not rendered
        cy.getByDataTest('axis-columns').should('not.exist')
        cy.getByDataTest('axis-filters').should('not.exist')

        // Check that the update buttons are not rendered
        cy.getByDataTest('update-buttons').should('not.exist')
    })

    it('renders an empty layout panel while loading a visualization', () => {
        const layoutPanelMockOptions = createMockOptions({
            loader: {
                ...mockOptions.partialStore?.preloadedState.loader,
                isVisualizationLoading: true,
            },
        })

        logger.debug(layoutPanelMockOptions)

        cy.mount(
            <MockAppWrapper {...layoutPanelMockOptions}>
                <LayoutPanel />
            </MockAppWrapper>
        )

        // Check that the visu type selector is visible
        cy.getByDataTest('visualization-type-selector-button').should(
            'not.exist'
        )

        // Check that the options button is visible
        cy.getByDataTest('visualization-options-button').should('not.exist')

        // Check that the expand layout toggle is not present
        cy.getByDataTest('expand-layout-panel-toggle').should('not.exist')

        cy.getByDataTest('axes-loading-skeletons').should('be.visible')

        // Check that the update buttons are not rendered
        cy.getByDataTest('update-buttons').should('not.exist')
    })

    it('renders with LINE_LIST visualization type, 3 column chips and 2 filter chips ', () => {
        const layoutPanelMockOptions = createMockOptions({
            dimensionSelection: {
                ...mockOptions.partialStore?.preloadedState.dimensionSelection,
                dataSourceId: 'test-id',
            },
        })

        cy.mount(
            <MockAppWrapper {...layoutPanelMockOptions}>
                <LayoutPanel />
            </MockAppWrapper>
        )

        // Check that the vis type selector is visible
        cy.getByDataTest('visualization-type-selector-button').should(
            'be.visible'
        )

        // Check that the options button is visible
        cy.getByDataTest('visualization-options-button').should('be.visible')

        // Check that the expand layout toggle is not present
        cy.getByDataTest('expand-layout-panel-toggle').should('be.visible')

        // Check that 2 groups are not rendered
        cy.get('[class*="columns"]').should('be.visible')
        cy.get('[class*="filters"]').should('be.visible')

        // Check that both axes are not rendered
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

        // Check that the update buttons are present
        cy.getByDataTest('update-buttons').should('be.visible')
    })

    it('suffixes chips using the whole layout, not just their own axis', () => {
        const crossAxisMetadata = {
            p1: {
                id: 'p1',
                name: 'Program1',
                programType: 'WITH_REGISTRATION',
            },
            p1s1: {
                id: 'p1s1',
                name: 'P1 Stage1',
                repeatable: false,
                hideDueDate: false,
                program: { id: 'p1' },
            },
            p1s2: {
                id: 'p1s2',
                name: 'P1 Stage2',
                repeatable: false,
                hideDueDate: false,
                program: { id: 'p1' },
            },
            'p1s1.weight': {
                id: 'p1s1.weight',
                name: 'Weight',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'NUMBER',
            },
            'p1s2.weight': {
                id: 'p1s2.weight',
                name: 'Weight',
                dimensionType: 'DATA_ELEMENT',
                valueType: 'NUMBER',
            },
        }

        const layoutPanelMockOptions = createMockOptions(
            {
                dimensionSelection: {
                    ...mockOptions.partialStore?.preloadedState
                        .dimensionSelection,
                    dataSourceId: 'test-id',
                },
                visUiConfig: {
                    ...visUiConfigInitialState,
                    visualizationType: 'LINE_LIST',
                    outputType: 'EVENT',
                    layout: {
                        columns: ['p1s1.weight'],
                        rows: [],
                        filters: ['p1s2.weight'],
                    },
                },
            },
            crossAxisMetadata
        )

        cy.mount(
            <MockAppWrapper {...layoutPanelMockOptions}>
                <LayoutPanel />
            </MockAppWrapper>
        )

        // Both dimensions are named "Weight" but sit in different axes. On its
        // own, each axis has just one stage, so a per-axis check would add no
        // suffix. Looking at the whole layout shows both stages, so both chips
        // get one.
        cy.getByDataTest('axis-columns')
            .findByDataTest('chip-suffix')
            .should('have.text', '· P1 Stage1')

        cy.getByDataTest('axis-filters')
            .findByDataTest('chip-suffix')
            .should('have.text', '· P1 Stage2')
    })

    it('renders the LINE_LIST update buttons in the order tracked entity, enrollment, event', () => {
        const layoutPanelMockOptions = createMockOptions({
            dimensionSelection: {
                ...mockOptions.partialStore?.preloadedState.dimensionSelection,
                dataSourceId: 'test-id',
            },
            visUiConfig: {
                ...mockOptions.partialStore?.preloadedState.visUiConfig,
                visualizationType: 'LINE_LIST',
            },
        })

        cy.mount(
            <MockAppWrapper {...layoutPanelMockOptions}>
                <LayoutPanel />
            </MockAppWrapper>
        )

        cy.getByDataTest('update-buttons')
            .findByDataTestLike('update-button-')
            .then(($buttons) => {
                const order = [...$buttons].map((el) => el.dataset.test)
                expect(order).to.deep.equal([
                    'update-button-tracked-entity',
                    'update-button-enrollment',
                    'update-button-event',
                ])
            })
    })

    const pivotOptions = (
        layout: {
            columns: string[]
            rows: string[]
            filters: string[]
        },
        layoutPanelHeight: LayoutPanelHeight = 'AUTO_FIT'
    ) =>
        createMockOptions({
            dimensionSelection: {
                ...mockOptions.partialStore?.preloadedState.dimensionSelection,
                dataSourceId: 'test-id',
            },
            ui: {
                ...uiSliceInitialState,
                layoutPanelHeight,
            },
            visUiConfig: {
                ...visUiConfigInitialState,
                visualizationType: 'PIVOT_TABLE',
                outputType: 'EVENT',
                layout,
                itemsByDimension: { ou: ['orgUnit1'] },
            },
        })

    const getAxisRowTracks = () =>
        cy.get('[class*="axisContainer"]').then(($el) => {
            const tracks = getComputedStyle($el[0])
                .gridTemplateRows.split(' ')
                .map(parseFloat)

            expect(tracks, 'two row tracks').to.have.length(2)

            return tracks
        })

    it('PIVOT_TABLE sizes columns and rows to their own content in content-height mode', () => {
        cy.viewport(420, 700)

        cy.mount(
            <MockAppWrapper
                {...pivotOptions({
                    columns: [
                        'ou',
                        'mchInfantFeeding',
                        'mchNutrition',
                        'ageAtVisit',
                        'genderId',
                    ],
                    rows: [],
                    filters: [],
                })}
            >
                <LayoutPanel />
            </MockAppWrapper>
        )

        cy.getByDataTest('axis-columns').should('be.visible')

        // In content mode each axis keeps its own height: the chip-heavy columns
        // axis is taller than the empty rows axis, which stays short.
        getAxisRowTracks().then(([columnsTrack, rowsTrack]) => {
            expect(columnsTrack).to.be.greaterThan(rowsTrack + 20)
        })
    })

    it('PIVOT_TABLE mirrors columns and rows when a user-defined height exceeds the content', () => {
        cy.viewport(1000, 800)

        cy.mount(
            <MockAppWrapper
                {...pivotOptions(
                    {
                        columns: ['ou', 'mchInfantFeeding'],
                        rows: ['genderId'],
                        filters: [],
                    },
                    600
                )}
            >
                <LayoutPanel />
            </MockAppWrapper>
        )

        cy.getByDataTest('axis-columns').should('be.visible')

        // The user-set 600px height far exceeds the content, so the extra space
        // is shared equally: the two row tracks are the same height.
        getAxisRowTracks().then(([columnsTrack, rowsTrack]) => {
            expect(columnsTrack).to.be.greaterThan(100)
            expect(Math.abs(columnsTrack - rowsTrack)).to.be.lessThan(2)
        })
    })

    it('renders the PIVOT_TABLE update buttons in the order enrollment, event, custom value', () => {
        const layoutPanelMockOptions = createMockOptions({
            dimensionSelection: {
                ...mockOptions.partialStore?.preloadedState.dimensionSelection,
                dataSourceId: 'test-id',
            },
            visUiConfig: {
                ...mockOptions.partialStore?.preloadedState.visUiConfig,
                visualizationType: 'PIVOT_TABLE',
            },
        })

        cy.mount(
            <MockAppWrapper {...layoutPanelMockOptions}>
                <LayoutPanel />
            </MockAppWrapper>
        )

        cy.getByDataTest('update-buttons')
            .findByDataTestLike('update-button-')
            .then(($buttons) => {
                const order = [...$buttons].map((el) => el.dataset.test)
                expect(order).to.deep.equal([
                    'update-button-enrollment',
                    'update-button-event',
                    'update-button-custom-value',
                ])
            })
    })
})
