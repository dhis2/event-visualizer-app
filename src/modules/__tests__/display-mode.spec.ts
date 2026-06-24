import type { DimensionMetadataItem } from '@types'
import { describe, it, expect } from 'vitest'
import {
    getDisplayMode,
    getDefaultLegendSetId,
    enterGroupMode,
    enterExactMode,
    setGroupLegendSet,
} from '../display-mode'

describe('getDisplayMode', () => {
    it("returns 'GROUP' when a legendSet is present", () => {
        expect(getDisplayMode({ legendSet: 'abc' })).toBe('GROUP')
    })

    it("returns 'GROUP' when a legendSet is present alongside a condition", () => {
        expect(
            getDisplayMode({ legendSet: 'abc', condition: 'IN:b1;b2' })
        ).toBe('GROUP')
    })

    it("returns 'EXACT' for an empty conditions object", () => {
        expect(getDisplayMode({})).toBe('EXACT')
    })

    it("returns 'EXACT' when only a condition is present", () => {
        expect(getDisplayMode({ condition: 'GT:5' })).toBe('EXACT')
    })

    it("returns 'EXACT' when legendSet is an empty string", () => {
        expect(getDisplayMode({ legendSet: '' })).toBe('EXACT')
    })
})

describe('getDefaultLegendSetId', () => {
    const dimensionWithDefault = {
        legendSetId: 'metadata-default',
    } as DimensionMetadataItem

    const dimensionWithoutDefault = {} as DimensionMetadataItem

    it("returns the dimension's legendSetId when set", () => {
        expect(
            getDefaultLegendSetId(dimensionWithDefault, [
                { id: 'first' },
                { id: 'second' },
            ])
        ).toBe('metadata-default')
    })

    it('falls back to the first available set when the dimension has none', () => {
        expect(
            getDefaultLegendSetId(dimensionWithoutDefault, [
                { id: 'first' },
                { id: 'second' },
            ])
        ).toBe('first')
    })

    it('returns undefined when the dimension has none and no sets are available', () => {
        expect(getDefaultLegendSetId(dimensionWithoutDefault, [])).toBe(
            undefined
        )
    })
})

describe('enterGroupMode', () => {
    it('sets the legendSet and clears any condition', () => {
        expect(enterGroupMode('default-set')).toEqual({
            legendSet: 'default-set',
            condition: undefined,
        })
    })
})

describe('enterExactMode', () => {
    it('clears both legendSet and condition', () => {
        expect(enterExactMode()).toEqual({
            legendSet: undefined,
            condition: undefined,
        })
    })
})

describe('setGroupLegendSet', () => {
    it('re-points the legendSet and clears any condition (bands belong to a set)', () => {
        expect(setGroupLegendSet('new-set')).toEqual({
            legendSet: 'new-set',
            condition: undefined,
        })
    })
})
