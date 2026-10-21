import { initialState as visUiConfigInitialState } from '@store/vis-ui-config-slice'
import { MockAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import type { AggregationType, RootState } from '@types'
import { CellValueAxis } from '../cell-value-axis'

const stage1 = {
    id: 's1',
    name: 'Stage 1',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'p1' },
}

const LONG_NAME =
    'Weight in kilograms measured at the antenatal care visit for reporting'

const metadata = {
    p1: {
        id: 'p1',
        name: 'Program 1',
        programType: 'WITH_REGISTRATION',
        programStages: [stage1],
        trackedEntityType: { id: 'tet1', name: 'Person' },
    },
    s1: stage1,
    tet1: { id: 'tet1', name: 'Person' },
    's1.de1': {
        id: 's1.de1',
        name: 'Weight in kg',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
        programId: 'p1',
        programStageId: 's1',
    },
    's1.de2': {
        id: 's1.de2',
        name: LONG_NAME,
        dimensionType: 'DATA_ELEMENT',
        valueType: 'NUMBER',
        programId: 'p1',
        programStageId: 's1',
    },
}

const buildMockOptions = (cellValue?: {
    id: string
    aggregationType: AggregationType
}): MockOptions => ({
    metadata,
    partialStore: {
        preloadedState: {
            visUiConfig: {
                ...visUiConfigInitialState,
                visualizationType: 'PIVOT_TABLE',
                outputType: 'EVENT',
                layout: {
                    ...visUiConfigInitialState.layout,
                    columns: ['s1.de1'],
                },
                cellValue,
            },
        } as Partial<RootState>,
    },
})

describe('CellValueAxis', () => {
    beforeEach(() => {
        cy.viewport(400, 300)
    })

    it('wraps a long data item name onto several lines without truncating it', () => {
        cy.mount(
            <MockAppWrapper
                {...buildMockOptions({ id: 's1.de2', aggregationType: 'SUM' })}
            >
                <CellValueAxis />
            </MockAppWrapper>
        )

        cy.getByDataTest('axis-content-value').should('contain.text', LONG_NAME)

        cy.getByDataTest('axis-content-value').then(($trigger) => {
            const { height } = $trigger[0].getBoundingClientRect()
            expect(height, 'wrapped onto more than one line').to.be.greaterThan(
                32
            )
            expect($trigger[0].scrollWidth).to.be.at.most(
                $trigger[0].clientWidth
            )
        })
    })

    /* There are over twenty aggregation types, so the menu has to scroll. */
    it('caps the aggregation menu height and scrolls', () => {
        cy.mount(
            <MockAppWrapper
                {...buildMockOptions({
                    id: 's1.de1',
                    aggregationType: 'AVERAGE',
                })}
            >
                <CellValueAxis />
            </MockAppWrapper>
        )

        cy.getByDataTest('cell-value-aggregation-trigger').click()

        cy.get('[data-test="dhis2-uicore-menu"]').then(($menu) => {
            const menu = $menu[0]
            expect(getComputedStyle(menu).maxHeight).to.equal('320px')
            expect(
                menu.scrollHeight,
                'content overflows, so it scrolls'
            ).to.be.greaterThan(menu.clientHeight)
        })
    })
})
