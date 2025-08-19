import { expect, describe, it } from 'vitest'
import { getInitialMetadata } from '../initial-metadata'

describe('getInitialMetadata', () => {
    it('should return relative periods and organization units', () => {
        const initialMetadata = getInitialMetadata()

        // Should contain relative periods as SimpleMetadataItem (single key-value pairs)
        expect(initialMetadata.TODAY).toBeDefined()
        expect(initialMetadata.TODAY).toEqual({ TODAY: expect.any(String) })

        // Should contain organization units as SimpleMetadataItem (single key-value pairs)
        expect(initialMetadata.USER_ORGUNIT).toBeDefined()
        expect(initialMetadata.USER_ORGUNIT).toEqual({
            USER_ORGUNIT: expect.any(String),
        })

        // Should return an object with string keys
        expect(typeof initialMetadata).toBe('object')
        expect(Object.keys(initialMetadata).length).toBeGreaterThan(0)
    })
})
