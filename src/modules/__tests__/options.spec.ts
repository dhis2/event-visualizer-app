import { DEFAULT_OPTIONS } from '@constants/options'
import { getNonDefaultOptions } from '@modules/options'
import type { LegendOption } from '@types'
import { describe, it, expect } from 'vitest'

describe('getNonDefaultOptions', () => {
    it('drops options that equal their default', () => {
        const result = getNonDefaultOptions({
            ...DEFAULT_OPTIONS,
            showData: false,
            displayDensity: 'NORMAL',
        })

        expect(result).toEqual({})
    })

    it('drops options that are explicitly undefined', () => {
        const result = getNonDefaultOptions({
            title: undefined,
            sortOrder: undefined,
        })

        expect(result).toEqual({})
    })

    it('keeps options that differ from their default', () => {
        const result = getNonDefaultOptions({
            ...DEFAULT_OPTIONS,
            showData: true,
            displayDensity: 'COMFORTABLE',
            title: 'My title',
        })

        expect(result).toEqual({
            showData: true,
            displayDensity: 'COMFORTABLE',
            title: 'My title',
        })
    })

    it('keeps a populated legend (default legend is undefined)', () => {
        const legend: LegendOption = {
            showKey: false,
            strategy: 'BY_DATA_ITEM',
            style: 'FILL',
        }

        const result = getNonDefaultOptions({ legend })

        expect(result).toEqual({ legend })
    })
})
