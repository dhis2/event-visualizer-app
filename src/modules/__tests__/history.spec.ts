import type { Location } from 'history'
import { describe, expect, it } from 'vitest'
import { getNavigationStateFromLocation } from '../history'

describe('getNavigationStateFromLocation', () => {
    it('should return "new" when pathname is empty', () => {
        const location = {
            pathname: '/',
            search: '',
        } as Location
        const result = getNavigationStateFromLocation(location)

        expect(result.visualizationId).toBe('new')
        expect(result.interpretationId).toBeNull()
    })

    it('should extract visualizationId from pathname', () => {
        const location = {
            pathname: '/abc123',
            search: '',
        } as Location
        const result = getNavigationStateFromLocation(location)

        expect(result.visualizationId).toBe('abc123')
        expect(result.interpretationId).toBeNull()
    })

    it('should ignore interpretationId when on "new" path', () => {
        const location = {
            pathname: '/',
            search: '?interpretationId=test123',
        } as Location
        const result = getNavigationStateFromLocation(location)

        expect(result.visualizationId).toBe('new')
        expect(result.interpretationId).toBeNull()
    })

    it('should return interpretationId when valid string and not on new path', () => {
        const location = {
            pathname: '/vis123',
            search: '?interpretationId=interp456',
        } as Location
        const result = getNavigationStateFromLocation(location)

        expect(result.visualizationId).toBe('vis123')
        expect(result.interpretationId).toBe('interp456')
    })

    it('should return null when interpretationId is empty string', () => {
        const location = {
            pathname: '/vis123',
            search: '?interpretationId=',
        } as Location
        const result = getNavigationStateFromLocation(location)

        expect(result.visualizationId).toBe('vis123')
        expect(result.interpretationId).toBeNull()
    })

    it('should handle multiple query params', () => {
        const location = {
            pathname: '/vis123',
            search: '?foo=bar&interpretationId=interp789&baz=qux',
        } as Location
        const result = getNavigationStateFromLocation(location)

        expect(result.visualizationId).toBe('vis123')
        expect(result.interpretationId).toBe('interp789')
    })
})
