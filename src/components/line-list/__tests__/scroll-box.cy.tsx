import React, { useState, useRef, memo } from 'react'
import { ScrollBox, useScrollBoxWidth } from '../scroll-box'
import {
    GridCenterColumnBottom,
    GridCenterColumnTop,
    GridContainer,
    GridEndColumn,
    GridStartColumn,
    GridTopRow,
} from '@components/grid'

const updateInputValue = (dataTest: string, value: number) => {
    cy.getByDataTest(dataTest)
        .focus()
        .type('{selectall}', { force: true })
        .type(value.toString(), { delay: 0, force: true })
}

const checkRenderCount = (count: number) => {
    cy.getByDataTest('reported-render-count').should(($el) => {
        const renderCount = parseInt($el.text())
        expect(renderCount).to.not.be.greaterThan(count)
    })
    cy.getByDataTest('reported-render-count').should(
        'contain',
        count.toString()
    )
}

const TestLayout: React.FC<{
    animated?: boolean
}> = ({ animated = false }) => {
    const [startColumnWidth, setStartColumnWidth] = useState(200)
    const [contentHeight, setContentHeight] = useState(300)
    const [contentWidth, setContentWidth] = useState(300)
    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <GridContainer>
                <GridTopRow />
                <GridStartColumn>
                    <div
                        data-test="start-column"
                        style={{
                            height: '100%',
                            width: `${startColumnWidth}px`,
                            backgroundColor: 'lightblue',
                            transition: animated ? 'all 300ms ease' : 'none',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            justifyContent: 'center',
                            fontSize: '12px',
                        }}
                    >
                        <label>
                            Width:
                            <input
                                data-test="start-column-width"
                                type="number"
                                value={startColumnWidth}
                                onChange={(e) =>
                                    setStartColumnWidth(Number(e.target.value))
                                }
                                style={{ width: '60px' }}
                            />
                        </label>
                    </div>
                </GridStartColumn>
                <GridCenterColumnTop />
                <GridCenterColumnBottom>
                    <ScrollBox>
                        <div
                            data-test="content"
                            style={{
                                width: `${contentWidth}px`,
                                height: `${contentHeight}px`,
                                backgroundColor: 'lightgrey',
                                transition: animated
                                    ? 'all 300ms ease'
                                    : 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                            }}
                        >
                            <div>
                                <label>
                                    Width:
                                    <input
                                        data-test="content-width"
                                        type="number"
                                        value={contentWidth}
                                        onChange={(e) =>
                                            setContentWidth(
                                                Number(e.target.value)
                                            )
                                        }
                                        style={{
                                            width: '60px',
                                            marginLeft: '5px',
                                        }}
                                    />
                                </label>
                                <label style={{ marginLeft: '10px' }}>
                                    Height:
                                    <input
                                        data-test="content-height"
                                        type="number"
                                        value={contentHeight}
                                        onChange={(e) =>
                                            setContentHeight(
                                                Number(e.target.value)
                                            )
                                        }
                                        style={{
                                            width: '60px',
                                            marginLeft: '5px',
                                        }}
                                    />
                                </label>
                            </div>

                            <div>
                                <WidthReporter />
                            </div>
                        </div>
                    </ScrollBox>
                </GridCenterColumnBottom>
                <GridEndColumn></GridEndColumn>
            </GridContainer>
        </div>
    )
}

const WidthReporter: React.FC = memo(() => {
    const renderCount = useRef(0)
    renderCount.current++
    const width = useScrollBoxWidth()
    return (
        <dl>
            <dt>width</dt>
            <dd data-test="reported-width-value">{width}</dd>
            <dt>renderCount:</dt>
            <dd data-test="reported-render-count">{renderCount.current}</dd>
        </dl>
    )
})
WidthReporter.displayName = 'WidthReporter'

describe(
    'Scroll box component',
    {
        viewportHeight: 1000,
        viewportWidth: 1000,
    },
    () => {
        let scrollbarWidth: number

        before(() => {
            // Calculate scrollbar width by creating a test element
            cy.window().then((win) => {
                const outer = win.document.createElement('div')
                outer.style.visibility = 'hidden'
                outer.style.overflow = 'scroll'
                win.document.body.appendChild(outer)

                const inner = win.document.createElement('div')
                outer.appendChild(inner)

                scrollbarWidth = outer.offsetWidth - inner.offsetWidth
                win.document.body.removeChild(outer)

                cy.log(`Detected scrollbar width: ${scrollbarWidth}px`)
            })
        })

        it('renders and provides context correctly', () => {
            cy.mount(<ScrollBox />)
            cy.getByDataTest('scroll-box-container').should('exist')
            cy.getByDataTest('scroll-box-content').should('exist')
        })

        it('throws error when hooks used outside ScrollBox', () => {
            // This should throw an error because the hook is used outside ScrollBox
            cy.on('uncaught:exception', (err) => {
                expect(err.message).to.include(
                    'useScrollboxWidth must be used within a ScrollBox'
                )
                return false // Prevent Cypress from failing the test
            })

            cy.mount(
                <div data-test="error-test">
                    <WidthReporter />
                </div>
            )
        })

        it('shows no scrollbars when content fits within container', () => {
            cy.mount(<TestLayout />)

            // Initial state: content is 300x300, ScrollBox should be ~800px wide
            // No scrollbars should be present
            cy.getByDataTest('scroll-box-container').should(($container) => {
                const container = $container[0]
                expect(container.scrollWidth).to.equal(container.clientWidth)
                expect(container.scrollHeight).to.equal(container.clientHeight)
            })

            // Verify reported width matches content width (no horizontal scrollbar)
            cy.getByDataTest('reported-width-value').should('contain', '300')
        })

        it('shows vertical scrollbar and keeps width constant when height exceeds container but width is smaller than container', () => {
            cy.mount(<TestLayout />)

            // Make content taller than the container (~920px available height)
            updateInputValue('content-height', 1200)

            // Should have vertical scrollbar but no horizontal scrollbar
            cy.getByDataTest('scroll-box-container').should(($container) => {
                const container = $container[0]
                expect(container.scrollHeight).to.be.greaterThan(
                    container.clientHeight
                )
                expect(container.scrollWidth).to.equal(container.clientWidth)
            })

            // Width should be reduced by scrollbar width due to vertical scrollbar
            cy.getByDataTest('reported-width-value').should(($width) => {
                const width = parseInt($width.text())
                expect(width).to.equal(300)
            })
        })

        it('shows vertical scrollbar and adjusts width when height exceeds container and width is constrained too', () => {
            cy.mount(<TestLayout />)

            // Make content taller than the container (~920px available height)
            updateInputValue('content-height', 1200)
            updateInputValue('content-width', 1200)

            // Should have vertical scrollbar and horizontal scrollbar
            cy.getByDataTest('scroll-box-container').should(($container) => {
                const container = $container[0]
                expect(container.scrollHeight).to.be.greaterThan(
                    container.clientHeight
                )
                expect(container.scrollWidth).to.greaterThan(
                    container.clientWidth
                )
            })

            // Width should be reduced by scrollbar width due to vertical scrollbar
            cy.getByDataTest('reported-width-value').should(($width) => {
                const width = parseInt($width.text())
                expect(width).to.equal(800 - scrollbarWidth)
            })
        })

        it('shows horizontal scrollbar when content width exceeds container width', () => {
            cy.mount(<TestLayout />)

            // Make content wider than the container (~800px available width)
            updateInputValue('content-width', 1000)

            // Should have horizontal scrollbar but no vertical scrollbar
            cy.getByDataTest('scroll-box-container').should(($container) => {
                const container = $container[0]
                expect(container.scrollWidth).to.be.greaterThan(
                    container.clientWidth
                )
                expect(container.scrollHeight).to.equal(container.clientHeight)
            })

            // Width should still be 800px (horizontal scrollbar doesn't affect width measurement)
            cy.getByDataTest('reported-width-value').should('contain', '800')
        })

        it('shows both scrollbars when content exceeds container in both dimensions', () => {
            cy.mount(<TestLayout />)

            // Make content larger than container in both dimensions
            updateInputValue('content-width', 1000)
            updateInputValue('content-height', 1200)

            // Should have both horizontal and vertical scrollbars
            cy.getByDataTest('scroll-box-container').should(($container) => {
                const container = $container[0]
                expect(container.scrollWidth).to.be.greaterThan(
                    container.clientWidth
                )
                expect(container.scrollHeight).to.be.greaterThan(
                    container.clientHeight
                )
            })

            // Width should be reduced by scrollbar width due to vertical scrollbar
            cy.getByDataTest('reported-width-value').should(($width) => {
                const width = parseInt($width.text())
                expect(width).to.equal(800 - scrollbarWidth)
            })
        })

        it('responds to window resizes', () => {
            cy.mount(<TestLayout />)

            // Scale the content to fit the window exactly
            updateInputValue('content-width', 800)
            updateInputValue('content-height', 1000)
            // Initial width with defaults (start-column: 200px):
            // Width: 1000 - 200 = 800px
            cy.getByDataTest('reported-width-value').should('contain', '800')

            // Reduce window width
            cy.viewport(600, 1000)

            // New width with same sibling, and scrollbar
            cy.getByDataTest('reported-width-value').should(($width) => {
                const width = parseInt($width.text())
                expect(width).to.equal(400 - scrollbarWidth)
            })
        })

        it('re-renders hook-consumer when width changes', () => {
            cy.mount(<TestLayout />)

            // Check initial render count
            checkRenderCount(2)

            // Change width of start-column (should affect ScrollBox width)
            updateInputValue('start-column-width', 900)

            // Should re-render: 1 (initial) + 1 (ResizeObserver initial) + 1 (ResizeObserver change) = 3
            checkRenderCount(3)

            // Change content dimensions (should not affect ScrollBox width)
            updateInputValue('content-width', 500)
            updateInputValue('content-height', 400)

            // Should still be at render count 3 (content changes don't affect container width)
            checkRenderCount(3)
        })

        it('handles rapid dimension changes with transitions', () => {
            cy.mount(<TestLayout animated={true} />)

            // Get initial render count and initial width
            checkRenderCount(2)
            cy.getByDataTest('reported-width-value').should('contain', '300')

            // Perform rapid dimension changes by quickly resizing the start-column
            // This will cause the ScrollBox container to change size rapidly
            updateInputValue('start-column-width', 800) // Whould result in width: 200
            cy.wait(300)
            updateInputValue('start-column-width', 900) // Whould result in width: 100
            cy.wait(300)
            updateInputValue('start-column-width', 750) // Whould result in width: 250
            cy.wait(300)
            updateInputValue('start-column-width', 850) // Final value: 150

            // Ensure none of the intermediate values are used
            cy.getByDataTest('reported-width-value').should(($el) => {
                const width = parseInt($el.text())
                expect(width).to.not.be.oneOf([200, 100, 250])
            })
            /* Without the debounce we would see as many as 250. With the debounce it is not
             * possible to predict exactly how many re-renders will occur during this animation
             * cycle, but it should not be an excessive amount. So to avoid this test from
             * becoming flaky, we simply check the number stays below 10 */
            cy.getByDataTest('reported-render-count').should(($el) => {
                const renderCount = parseInt($el.text())
                expect(renderCount).to.not.be.greaterThan(9)
            })

            cy.getByDataTest('reported-width-value').should('contain', '150')
        })

        it('handles multiple scroll-boxes independently', () => {
            cy.mount(
                <div style={{ display: 'flex', gap: '20px' }}>
                    {/* First container - 300px wide */}
                    <div
                        data-test="container-1"
                        style={{ width: '300px', height: '200px' }}
                    >
                        <ScrollBox>
                            <div data-test="content-1">
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: 190,
                                    }}
                                    data-test="width-reporter-1"
                                >
                                    <WidthReporter />
                                </span>
                            </div>
                        </ScrollBox>
                    </div>

                    {/* Second container - 500px wide */}
                    <div
                        data-test="container-2"
                        style={{ width: '500px', height: '200px' }}
                    >
                        <ScrollBox>
                            <div data-test="content-2">
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: 290,
                                    }}
                                    data-test="width-reporter-2"
                                >
                                    <WidthReporter />
                                </span>
                            </div>
                        </ScrollBox>
                    </div>
                </div>
            )

            // Each ScrollBox should report its container's width
            cy.getByDataTest('width-reporter-1')
                .find('[data-test="reported-width-value"]')
                .should('contain', '190')

            cy.getByDataTest('width-reporter-2')
                .find('[data-test="reported-width-value"]')
                .should('contain', '290')
        })
    }
)
