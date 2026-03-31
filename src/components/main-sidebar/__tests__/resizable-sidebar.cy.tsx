import { CssVariables } from '@dhis2/ui'
import React from 'react'
import { Provider } from 'react-redux'
import { useResizableSidebar } from '../use-resizable-sidebar'
import {
    MAIN_SIDEBAR_DEFAULT_WIDTH,
    MAIN_SIDEBAR_MIN_WIDTH,
    MAIN_SIDEBAR_STORAGE_KEY,
} from '@constants/panels'
import { uiSlice } from '@store/ui-slice'
import { setupStore } from '@test-utils/setup-store'

const ResizableTestHarness: React.FC = () => {
    const { containerRef, isDragging, width, eventHandlers } =
        useResizableSidebar()

    return (
        <div style={{ display: 'flex', blockSize: '100vh' }}>
            <div
                ref={containerRef}
                data-test="sidebar"
                style={{
                    position: 'relative',
                    inlineSize: width,
                    flexShrink: 0,
                    background: '#f0f0f0',
                    overflow: 'hidden',
                }}
            >
                <span data-test="width-display">{Math.round(width)}</span>
                <span data-test="dragging-display">
                    {isDragging ? 'dragging' : 'idle'}
                </span>
                <div
                    data-test="resize-handle"
                    style={{
                        position: 'absolute',
                        insetBlockStart: 0,
                        insetInlineEnd: 0,
                        inlineSize: 4,
                        blockSize: '100%',
                        cursor: 'col-resize',
                        touchAction: 'none',
                    }}
                    {...eventHandlers}
                />
            </div>
            <div style={{ flex: 1, background: '#e0e0e0' }} />
        </div>
    )
}

const createStore = () =>
    setupStore(
        { [uiSlice.name]: uiSlice.reducer },
        { [uiSlice.name]: uiSlice.getInitialState() }
    )

const mountHarness = () => {
    localStorage.removeItem(MAIN_SIDEBAR_STORAGE_KEY)
    const store = createStore()
    cy.mount(
        <Provider store={store}>
            <CssVariables colors spacers theme />
            <ResizableTestHarness />
        </Provider>
    )
    return store
}

describe(
    'Resizable sidebar drag behavior',
    { viewportWidth: 1280, viewportHeight: 800 },
    () => {
        beforeEach(() => {
            localStorage.removeItem(MAIN_SIDEBAR_STORAGE_KEY)
        })

        it('renders at default width', () => {
            mountHarness()

            cy.getByDataTest('width-display').should(
                'have.text',
                String(MAIN_SIDEBAR_DEFAULT_WIDTH)
            )
            cy.getByDataTest('dragging-display').should('have.text', 'idle')
        })

        it('can be resized by dragging the handle', () => {
            mountHarness()

            cy.getByDataTest('resize-handle').then(($handle) => {
                // Stub pointer capture APIs — Cypress synthetic events
                // bypass browser capture routing, so hasPointerCapture
                // would return false without this
                const el = $handle[0]
                cy.stub(el, 'setPointerCapture')
                cy.stub(el, 'releasePointerCapture')
                cy.stub(el, 'hasPointerCapture').returns(true)

                const rect = el.getBoundingClientRect()
                const startX = rect.left + rect.width / 2
                const startY = rect.top + rect.height / 2

                cy.getByDataTest('resize-handle')
                    .trigger('pointerdown', {
                        clientX: startX,
                        clientY: startY,
                        pointerId: 1,
                        isPrimary: true,
                    })
                    .trigger('pointermove', {
                        clientX: startX + 100,
                        clientY: startY,
                        pointerId: 1,
                        isPrimary: true,
                    })

                cy.getByDataTest('dragging-display').should(
                    'have.text',
                    'dragging'
                )

                cy.getByDataTest('resize-handle').trigger('pointerup', {
                    clientX: startX + 100,
                    clientY: startY,
                    pointerId: 1,
                    isPrimary: true,
                })

                cy.getByDataTest('dragging-display').should('have.text', 'idle')
                cy.getByDataTest('width-display').should(
                    'have.text',
                    String(MAIN_SIDEBAR_DEFAULT_WIDTH + 100)
                )
            })
        })

        it('clamps to minimum width when dragging left', () => {
            mountHarness()

            cy.getByDataTest('resize-handle').then(($handle) => {
                const el = $handle[0]
                cy.stub(el, 'setPointerCapture')
                cy.stub(el, 'releasePointerCapture')
                cy.stub(el, 'hasPointerCapture').returns(true)

                const rect = el.getBoundingClientRect()
                const startX = rect.left + rect.width / 2
                const startY = rect.top + rect.height / 2

                cy.getByDataTest('resize-handle')
                    .trigger('pointerdown', {
                        clientX: startX,
                        clientY: startY,
                        pointerId: 1,
                        isPrimary: true,
                    })
                    .trigger('pointermove', {
                        clientX: 50,
                        clientY: startY,
                        pointerId: 1,
                        isPrimary: true,
                    })
                    .trigger('pointerup', {
                        clientX: 50,
                        clientY: startY,
                        pointerId: 1,
                        isPrimary: true,
                    })

                cy.getByDataTest('width-display').should(
                    'have.text',
                    String(MAIN_SIDEBAR_MIN_WIDTH)
                )
            })
        })

        it('resets to default width on double-click', () => {
            localStorage.setItem(MAIN_SIDEBAR_STORAGE_KEY, '600')
            const store = createStore()
            cy.mount(
                <Provider store={store}>
                    <CssVariables colors spacers theme />
                    <ResizableTestHarness />
                </Provider>
            )

            cy.getByDataTest('width-display').should('have.text', '600')

            cy.getByDataTest('resize-handle').dblclick()

            cy.getByDataTest('width-display').should(
                'have.text',
                String(MAIN_SIDEBAR_DEFAULT_WIDTH)
            )
        })
    }
)
