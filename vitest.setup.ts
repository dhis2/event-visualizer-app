import { configure } from '@testing-library/dom'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { expect, afterEach } from 'vitest'
import 'vitest-canvas-mock'

expect.extend(matchers)
configure({
    testIdAttribute: 'data-test',
})
global.CSS.supports = () => true
afterEach(() => {
    cleanup()
})
