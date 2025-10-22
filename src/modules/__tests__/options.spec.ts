import { describe, expect, it } from 'vitest'
import { getOptionsForRequest } from '@modules/options'

describe('getOptionsForRequest', () => {
    it('getOptionsForRequest returns the correct options', () => {
        const options = getOptionsForRequest()
        expect(options).toEqual([
            ['completedOnly', { defaultValue: false }],
            ['skipRounding', { defaultValue: false }],
        ])
    })
})
