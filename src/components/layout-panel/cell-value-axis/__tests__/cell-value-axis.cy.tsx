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

/* The pencil must sit directly after the label rather than at the far edge of
 * the axis. The label element's own box is no guide — when it stretches to fill
 * the axis its right edge lands next to the pencil however far away the text
 * ends. So the comparison is against the last rect of the rendered text. */
const expectPencilDirectlyAfterLabel = () => {
    cy.getByDataTest('axis-content-value').then(($trigger) => {
        const trigger = $trigger[0]
        const label = trigger.querySelector('[data-test="cell-value-label"]')
        const pencil = trigger.querySelector('svg')
        if (!label || !pencil) {
            throw new Error('label or pencil missing from the value axis')
        }

        const range = trigger.ownerDocument.createRange()
        range.selectNodeContents(label)
        const textRects = Array.from(range.getClientRects())
        const lastTextRect = textRects[textRects.length - 1]
        const gap = pencil.getBoundingClientRect().left - lastTextRect.right

        expect(gap, 'gap between end of text and pencil').to.be.within(0, 12)
    })
}

describe('CellValueAxis', () => {
    beforeEach(() => {
        cy.viewport(400, 300)
    })

    it('places the pencil directly after the Count label', () => {
        cy.mount(
            <MockAppWrapper {...buildMockOptions()}>
                <CellValueAxis />
            </MockAppWrapper>
        )

        cy.getByDataTest('axis-content-value').should('contain.text', 'Count')
        expectPencilDirectlyAfterLabel()
    })

    it('places the pencil directly after the data item name and aggregation type', () => {
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

        cy.getByDataTest('axis-content-value')
            .should('contain.text', 'Weight in kg')
            .and('contain.text', 'Average')
        expectPencilDirectlyAfterLabel()
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
})
