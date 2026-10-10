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

/* The controls follow the label rather than sitting at the far edge of the
 * axis. The label element's own box is no guide — when it stretches, its right
 * edge lands next to the controls however far away the text ends. So the
 * comparison is against the last rect of the rendered text. */
const expectDirectlyAfterLabel = (dataTest: string) => {
    cy.getByDataTest('axis-content-value').then(($content) => {
        const content = $content[0]
        const label = content.querySelector('[data-test="cell-value-label"]')
        const control = content.querySelector(`[data-test="${dataTest}"]`)
        if (!label || !control) {
            throw new Error(`label or ${dataTest} missing from the value axis`)
        }

        const range = content.ownerDocument.createRange()
        range.selectNodeContents(label)
        const textRects = Array.from(range.getClientRects())
        const lastTextRect = textRects[textRects.length - 1]
        const gap = control.getBoundingClientRect().left - lastTextRect.right

        expect(gap, `gap between end of text and ${dataTest}`).to.be.within(
            0,
            12
        )
    })
}

describe('CellValueAxis', () => {
    beforeEach(() => {
        cy.viewport(400, 300)
    })

    it('shows Count alone, with no controls', () => {
        cy.mount(
            <MockAppWrapper {...buildMockOptions()}>
                <CellValueAxis />
            </MockAppWrapper>
        )

        cy.getByDataTest('axis-content-value').should('contain.text', 'Count')
        cy.getByDataTest('cell-value-aggregation-trigger').should('not.exist')
        cy.getByDataTest('cell-value-reset').should('not.exist')
    })

    it('places the aggregation menu directly after the data item name', () => {
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
        expectDirectlyAfterLabel('cell-value-aggregation-trigger')
    })

    it('places the reset control after the aggregation menu', () => {
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

        cy.getByDataTest('axis-content-value').then(($content) => {
            const aggregation = $content[0].querySelector(
                '[data-test="cell-value-aggregation-trigger"]'
            )
            const reset = $content[0].querySelector(
                '[data-test="cell-value-reset"]'
            )
            if (!aggregation || !reset) {
                throw new Error('aggregation or reset missing')
            }
            expect(reset.getBoundingClientRect().left).to.be.greaterThan(
                aggregation.getBoundingClientRect().right - 1
            )
        })
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

    /* The label under "VALUE" starts where the axis label starts, like a chip
     * does — any inline padding on the content would nudge it out of line. */
    it('left-aligns the label with the VALUE axis label', () => {
        cy.mount(
            <MockAppWrapper {...buildMockOptions()}>
                <CellValueAxis />
            </MockAppWrapper>
        )

        cy.getByDataTest('axis-value').then(($axis) => {
            const axisLabel = $axis[0].querySelector('div')
            const valueLabel = $axis[0].querySelector(
                '[data-test="cell-value-label"]'
            )
            if (!axisLabel || !valueLabel) {
                throw new Error('axis label or value label missing')
            }

            expect(
                valueLabel.getBoundingClientRect().left,
                'label left edges line up'
            ).to.be.closeTo(axisLabel.getBoundingClientRect().left, 0.5)
        })
    })

    /* A button holding only an SVG has no text baseline, so it rides high in a
     * baseline-aligned row unless it is nudged down. */
    it('vertically centres the reset icon against the label', () => {
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

        cy.getByDataTest('axis-content-value').then(($content) => {
            const content = $content[0]
            const label = content.querySelector(
                '[data-test="cell-value-label"]'
            )
            const reset = content.querySelector(
                '[data-test="cell-value-reset"]'
            )
            if (!label || !reset) {
                throw new Error('label or reset missing')
            }

            const midOf = (el: Element) => {
                const box = el.getBoundingClientRect()
                return box.top + box.height / 2
            }

            expect(
                midOf(reset),
                'reset icon shares the label centre line'
            ).to.be.closeTo(midOf(label), 1)
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
