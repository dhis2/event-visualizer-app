import { configure } from '@testing-library/dom'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import ResizeObserver from 'resize-observer-polyfill'
import { expect, afterEach } from 'vitest'
import 'vitest-canvas-mock'

expect.extend(matchers)
configure({
    testIdAttribute: 'data-test',
})
// Emulate CSS.supports API
// Needed with Highcharts >= 12.2.0
// See: https://github.com/highcharts/highcharts/issues/22910
global.CSS.supports = () => true

// Add ResizeObserver polyfill
global.ResizeObserver = ResizeObserver

afterEach(() => {
    cleanup()
})
