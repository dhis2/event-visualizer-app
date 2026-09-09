import { Analytics } from '@dhis2/analytics'
import { MockAppWrapper } from '@test-utils/app-wrapper'
import {
    getLineListFixtureQueryData,
    loadLineListFixture,
    type LineListFixture,
} from './line-list-fixture-utils'
import { VisualizationTestHost } from './visualization-test-host'

const simpleLineList = loadLineListFixture('e2e-enrollment')
const largeLineListWithLegend = loadLineListFixture(
    'inpatient-extra-columns-and-legends'
)
const inpatientVisit = loadLineListFixture('inpatient-visit-overview-bombali')

type QueryData = ReturnType<typeof getLineListFixtureQueryData>

type MountLineListOptions = {
    analytics?: QueryData[string]
}

const mountLineList = (
    fixture: LineListFixture,
    { analytics }: MountLineListOptions = {}
) => {
    const visualizationPayload = fixture.eventVisualization as { id: string }
    cy.mount(
        <div style={{ width: '100vw', height: '100vh' }}>
            <MockAppWrapper
                partialStore={{
                    preloadedState: {
                        navigation: {
                            visualizationId: visualizationPayload.id,
                            interpretationId: null,
                        },
                    },
                }}
                queryData={getLineListFixtureQueryData(
                    fixture,
                    analytics ? { analytics } : {}
                )}
            >
                <VisualizationTestHost />
            </MockAppWrapper>
        </div>
    )
    // Wait for the load-and-fetch pipeline to render the table
    cy.getByDataTest('line-list-data-table')
}

/* Resolves the first analytics request with the fixture response and leaves
 * every following request pending, so the refetch overlay stays visible. */
const analyticsWithPendingRefetch = (
    fixture: LineListFixture
): QueryData[string] => {
    let requestCount = 0
    return (() => {
        requestCount += 1
        return requestCount === 1
            ? fixture.response
            : new Promise(() => undefined)
    }) as QueryData[string]
}

describe(
    'Line List',
    {
        viewportWidth: 1024,
        viewportHeight: 768,
    },
    () => {
        beforeEach(() => {
            /* Analytics.getAnalytics caches a singleton bound to the first
             * data engine it sees; reset it so each test's mock data provider
             * is used. */
            ;(
                Analytics.getAnalytics as unknown as { analytics?: unknown }
            ).analytics = undefined
        })

        describe('Scrolling behavior', () => {
            it('small table gets no scrollbars', () => {
                mountLineList(simpleLineList)

                // Check that the scroll box doesn't have scrollbars
                cy.getByDataTest('scroll-box-container').should(($el) => {
                    expect($el[0].scrollWidth).to.equal($el[0].clientWidth)
                    expect($el[0].scrollHeight).to.equal($el[0].clientHeight)
                })
            })

            it('tall but not too wide table gets vertical scrollbar', () => {
                mountLineList(inpatientVisit)

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
                mountLineList(largeLineListWithLegend)

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

            it(
                'large table with legend key also has a scrollbar on the legend-key area',
                /* Short enough that the legend key cannot fit its items */
                { viewportHeight: 500 },
                () => {
                    mountLineList(largeLineListWithLegend)

                    // Check that legend key is visible
                    cy.getByDataTest('visualization-legend-key').should(
                        'be.visible'
                    )

                    // Check that legend key area has a scrollbar
                    cy.getByDataTest('visualization-legend-key').should(
                        ($el) => {
                            // Legend key should have scrollbar (scrollHeight > clientHeight)
                            expect($el[0].scrollHeight).to.be.greaterThan(
                                $el[0].clientHeight
                            )
                        }
                    )
                }
            )

            it('table header cells are sticky when scrolling down but scroll when scrolling sideways', () => {
                mountLineList(largeLineListWithLegend)

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
                mountLineList(largeLineListWithLegend)

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

            it('pagination is sticky in both directions', () => {
                mountLineList(largeLineListWithLegend)

                // Scroll both vertically and horizontally
                cy.getByDataTest('scroll-box-container').scrollTo(300, 200, {
                    duration: 0,
                })

                // Check that sticky-pagination-container is positioned correctly
                cy.getByDataTest('sticky-pagination-container').should(
                    ($pagination) => {
                        const paginationRect =
                            $pagination[0].getBoundingClientRect()
                        const scrollBox = document.querySelector(
                            '[data-test="scroll-box-container"]'
                        )

                        expect(scrollBox).to.have.property(
                            'getBoundingClientRect'
                        )
                        const scrollBoxRect = scrollBox!.getBoundingClientRect()
                        const BORDER_WIDTH = 1

                        // Bottom-left and bottom-right should match (accounting for scrollbars)
                        expect(paginationRect.left).to.equal(
                            scrollBoxRect.left + BORDER_WIDTH
                        )
                        expect(paginationRect.right).to.equal(
                            scrollBoxRect.left +
                                (scrollBox?.clientWidth ?? 0) +
                                BORDER_WIDTH
                        ) // Allow for vertical scrollbar
                        expect(paginationRect.bottom).to.equal(
                            scrollBoxRect.top +
                                (scrollBox?.clientHeight ?? 0) +
                                BORDER_WIDTH
                        )
                    }
                )
            })
        })

        describe('Fetching overlay', () => {
            const triggerPendingRefetch = () => {
                // Trigger a refetch that never resolves by sorting a column
                cy.getByDataTest('data-table-header')
                    .first()
                    .find('button')
                    .click()
                cy.getByDataTest('fetch-overlay').should('be.visible')
                /* Clicking the header may scroll the container; reset so the
                 * geometry assertions run against the resting position. */
                cy.getByDataTest('scroll-box-container').scrollTo(0, 0, {
                    duration: 0,
                    ensureScrollable: false,
                })
            }

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

                    expect(overlayRect.left).to.equal(scrollBoxRect.left + 1)
                    expect(overlayRect.top).to.equal(scrollBoxRect.top + 1)
                    expect(overlayRect.right).to.equal(
                        scrollBoxRect.left + (scrollBox?.clientWidth ?? 0) + 1
                    )
                    expect(overlayRect.bottom).to.equal(
                        scrollBoxRect.top + (scrollBox?.clientHeight ?? 0) + 1
                    )
                })
            }

            it('while refetching, the table gets an overlay but the legend key does not', () => {
                mountLineList(largeLineListWithLegend, {
                    analytics: analyticsWithPendingRefetch(
                        largeLineListWithLegend
                    ),
                })

                triggerPendingRefetch()
                expectOverlayToCoverScrollBox()

                // Check that legend key remains accessible (not covered by overlay)
                // Note that the click would cause Cypress to throw an error if the element was covered
                cy.getByDataTest('visualization-legend-key').click({
                    force: false,
                })
            })

            it('while refetching a small table, the overlay covers only the scroll container', () => {
                mountLineList(simpleLineList, {
                    analytics: analyticsWithPendingRefetch(simpleLineList),
                })

                triggerPendingRefetch()
                expectOverlayToCoverScrollBox()
            })
        })
    }
)
