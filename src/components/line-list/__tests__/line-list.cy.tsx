import { CssVariables } from '@dhis2/ui'
import type { CurrentVisualization } from '@types'
import type { FC, ReactNode } from 'react'
import simpleLineList from '../__fixtures__/e2e-enrollment.json'
import largeLineListWithLegend from '../__fixtures__/inpatient-cases-under-5-years-female-this-year-additional-columns-and-legends.json'
import inpatientVisit from '../__fixtures__/inpatient-visit-overview-this-year-bombali.json'
import { LineList } from '../line-list'
import type { LineListAnalyticsData } from '../types'

const TestContainer: FC<{ children: ReactNode }> = ({ children }) => (
    <div style={{ width: '100vw', height: '100vh' }}>
        {children}
        <CssVariables colors spacers theme />
    </div>
)

describe(
    'Line List',
    {
        viewportWidth: 1024,
        viewportHeight: 768,
    },
    () => {
        describe('Scrolling behavior', () => {
            it('small table gets no scrollbars', () => {
                cy.mount(
                    <TestContainer>
                        <LineList
                            analyticsData={
                                simpleLineList.responses as unknown as LineListAnalyticsData
                            }
                            onDataSort={cy.stub()}
                            onPaginate={cy.stub()}
                            visualization={
                                simpleLineList.visualization as unknown as CurrentVisualization
                            }
                        />
                    </TestContainer>
                )

                // Check that the scroll box doesn't have scrollbars
                cy.getByDataTest('scroll-box-container').should(($el) => {
                    expect($el[0].scrollWidth).to.equal($el[0].clientWidth)
                    expect($el[0].scrollHeight).to.equal($el[0].clientHeight)
                })
            })

            it('tall but not too wide table gets vertical scrollbar', () => {
                cy.mount(
                    <TestContainer>
                        <LineList
                            analyticsData={
                                inpatientVisit.responses as unknown as LineListAnalyticsData
                            }
                            onDataSort={cy.stub()}
                            onPaginate={cy.stub()}
                            visualization={
                                inpatientVisit.visualization as unknown as CurrentVisualization
                            }
                        />
                    </TestContainer>
                )

                // Check for vertical scrollbar presence
                cy.getByDataTest('scroll-box-container').should(($el) => {
                    // Should have vertical scrollbar (scrollHeight > clientHeight)
                    expect($el[0].scrollHeight).to.be.greaterThan(
                        $el[0].clientHeight
                    )
                    // Should NOT have horizontal scrollbar (scrollWidth equals clientWidth)
                    expect($el[0].scrollWidth).to.equal($el[0].clientWidth)
                })
            })

            it('large table gets two scrollbars', () => {
                cy.mount(
                    <TestContainer>
                        <LineList
                            analyticsData={
                                largeLineListWithLegend.responses as unknown as LineListAnalyticsData
                            }
                            onDataSort={cy.stub()}
                            onPaginate={cy.stub()}
                            visualization={
                                largeLineListWithLegend.visualization as unknown as CurrentVisualization
                            }
                        />
                    </TestContainer>
                )

                // Check for both scrollbars
                cy.getByDataTest('scroll-box-container').should(($el) => {
                    expect($el[0].scrollWidth).to.be.greaterThan(
                        $el[0].clientWidth
                    )
                    expect($el[0].scrollHeight).to.be.greaterThan(
                        $el[0].clientHeight
                    )
                })
            })

            it('large table with legend key also has a scrollbar on the legend-key area', () => {
                cy.mount(
                    <TestContainer>
                        <LineList
                            analyticsData={
                                largeLineListWithLegend.responses as unknown as LineListAnalyticsData
                            }
                            onDataSort={cy.stub()}
                            onPaginate={cy.stub()}
                            visualization={
                                largeLineListWithLegend.visualization as unknown as CurrentVisualization
                            }
                        />
                    </TestContainer>
                )

                // Check that legend key is visible
                cy.getByDataTest('visualization-legend-key').should(
                    'be.visible'
                )

                // Check that legend key area has a scrollbar
                cy.getByDataTest('visualization-legend-key').should(($el) => {
                    // Legend key should have scrollbar (scrollHeight > clientHeight)
                    expect($el[0].scrollHeight).to.be.greaterThan(
                        $el[0].clientHeight
                    )
                })
            })

            it('table header cells are sticky when scrolling down but scroll when scrolling sideways', () => {
                cy.mount(
                    <TestContainer>
                        <LineList
                            analyticsData={
                                largeLineListWithLegend.responses as unknown as LineListAnalyticsData
                            }
                            onDataSort={cy.stub()}
                            onPaginate={cy.stub()}
                            visualization={
                                largeLineListWithLegend.visualization as unknown as CurrentVisualization
                            }
                        />
                    </TestContainer>
                )

                // Get the first header cell for reference
                cy.getByDataTest('data-table-header').first().as('firstHeader')

                // Scroll down - header should remain sticky (same position)
                cy.getByDataTest('scroll-box-container').scrollTo(0, 200, {
                    duration: 0,
                })
                cy.get('@firstHeader').should('be.visible')

                // Scroll horizontally far enough to push first column out of view
                cy.getByDataTest('scroll-box-container').scrollTo(500, 200, {
                    duration: 0,
                })
                cy.get('@firstHeader').should('not.be.visible')
            })

            it('table data cells scroll in both directions', () => {
                cy.mount(
                    <TestContainer>
                        <LineList
                            analyticsData={
                                largeLineListWithLegend.responses as unknown as LineListAnalyticsData
                            }
                            onDataSort={cy.stub()}
                            onPaginate={cy.stub()}
                            visualization={
                                largeLineListWithLegend.visualization as unknown as CurrentVisualization
                            }
                        />
                    </TestContainer>
                )

                // Get the first data cell for reference
                cy.getByDataTest('line-list-data-table-body')
                    .find('td')
                    .first()
                    .as('firstCell')

                // Scroll down - first row should go out of view
                cy.getByDataTest('scroll-box-container').scrollTo(0, 300, {
                    duration: 0,
                })
                cy.get('@firstCell').should('not.be.visible')

                // Reset and scroll horizontally - first column should go out of view
                cy.getByDataTest('scroll-box-container').scrollTo(0, 0, {
                    duration: 0,
                })
                cy.getByDataTest('scroll-box-container').scrollTo(500, 0, {
                    duration: 0,
                })
                cy.get('@firstCell').should('not.be.visible')
            })

            it('pagination sits below the scroll area and does not scroll with the table', () => {
                cy.mount(
                    <TestContainer>
                        <LineList
                            analyticsData={
                                largeLineListWithLegend.responses as unknown as LineListAnalyticsData
                            }
                            onDataSort={cy.stub()}
                            onPaginate={cy.stub()}
                            visualization={
                                largeLineListWithLegend.visualization as unknown as CurrentVisualization
                            }
                        />
                    </TestContainer>
                )

                cy.getByDataTest('sticky-pagination-container').then(
                    ($before) => {
                        const before = $before[0].getBoundingClientRect()

                        // Scroll the table in both directions
                        cy.getByDataTest('scroll-box-container').scrollTo(
                            300,
                            200,
                            { duration: 0 }
                        )

                        cy.getByDataTest('sticky-pagination-container').should(
                            ($after) => {
                                const after = $after[0].getBoundingClientRect()

                                // The pagination lives outside the scroll container,
                                // so scrolling the table must not move it
                                expect(after.top).to.equal(before.top)
                                expect(after.left).to.equal(before.left)

                                const scrollBox = document.querySelector(
                                    '[data-test="scroll-box-container"]'
                                )
                                const scrollBoxRect =
                                    scrollBox!.getBoundingClientRect()

                                // It sits directly beneath the scroll area and spans its width
                                expect(Math.round(after.top)).to.equal(
                                    Math.round(scrollBoxRect.bottom)
                                )
                                expect(Math.round(after.left)).to.equal(
                                    Math.round(scrollBoxRect.left)
                                )
                                expect(Math.round(after.right)).to.equal(
                                    Math.round(scrollBoxRect.right)
                                )
                            }
                        )
                    }
                )
            })
        })

        describe('Fetching overlay', () => {
            const expectOverlayToCoverScrollBox = () => {
                // Overlay and spinner are visible
                cy.getByDataTest('fetch-overlay').should('be.visible')
                cy.getByDataTest('dhis2-uicore-circularloader').should(
                    'be.visible'
                )

                // Overlay has z-index of 2000
                cy.getByDataTest('fetch-overlay').should(
                    'have.css',
                    'z-index',
                    '2000'
                )

                // Check that overlay covers the scroll-box-container
                cy.getByDataTest('fetch-overlay').should(($overlay) => {
                    const overlayRect = $overlay[0].getBoundingClientRect()
                    const scrollBox = document.querySelector(
                        '[data-test="scroll-box-container"]'
                    )

                    expect(scrollBox).to.have.property('getBoundingClientRect')
                    const scrollBoxRect = scrollBox!.getBoundingClientRect()

                    // The scroll box no longer has a border, so the overlay aligns
                    // flush with the scroll box (no 1px offset)
                    expect(overlayRect.left).to.equal(scrollBoxRect.left)
                    expect(overlayRect.top).to.equal(scrollBoxRect.top)
                    expect(overlayRect.right).to.equal(
                        scrollBoxRect.left + (scrollBox?.clientWidth ?? 0)
                    )
                    expect(overlayRect.bottom).to.equal(
                        scrollBoxRect.top + (scrollBox?.clientHeight ?? 0)
                    )
                })
            }

            it('when isFetching is true, the table gets an overlay but the legend key does not', () => {
                cy.mount(
                    <TestContainer>
                        <LineList
                            isFetching
                            analyticsData={
                                largeLineListWithLegend.responses as unknown as LineListAnalyticsData
                            }
                            onDataSort={cy.stub()}
                            onPaginate={cy.stub()}
                            visualization={
                                largeLineListWithLegend.visualization as unknown as CurrentVisualization
                            }
                        />
                    </TestContainer>
                )

                expectOverlayToCoverScrollBox()

                // Check that legend key remains accessible (not covered by overlay)
                // Note that the click would cause Cypress to throw an error if the element was covered
                cy.getByDataTest('visualization-legend-key').click({
                    force: false,
                })
            })
        })
    }
)
