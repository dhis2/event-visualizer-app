import { expect, describe, it } from 'vitest'
import { getInitialMetadata } from '../initial-metadata'

describe('getInitialMetadata', () => {
    it('should return relative periods and organization units', () => {
        const initialMetadata = getInitialMetadata()

        // Should contain relative periods as SimpleMetadataItem (single key-value pairs)
        expect(initialMetadata.TODAY).toBeDefined()
        expect(initialMetadata.TODAY).toBe('Today')

        // Should contain organization units as SimpleMetadataItem (single key-value pairs)
        expect(initialMetadata.USER_ORGUNIT).toBeDefined()
        expect(initialMetadata.USER_ORGUNIT).toBe('User organisation unit')

        // Should return an object with string keys
        expect(typeof initialMetadata).toBe('object')
        expect(Object.keys(initialMetadata).length).toBeGreaterThan(0)
    })
})
