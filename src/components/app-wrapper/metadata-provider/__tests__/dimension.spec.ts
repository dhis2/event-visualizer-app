import { describe, it, expect } from 'vitest'
import { parseDimensionIdInput } from '../dimension'

describe('parseDimensionIdInput', () => {
    describe('valid inputs', () => {
        it('parses a single dimension ID', () => {
            const result = parseDimensionIdInput('dimensionId')
            expect(result).toEqual({
                ids: ['dimensionId'],
                repetitionIndex: undefined,
            })
        })

        it('parses program/stage ID and dimension ID', () => {
            const result = parseDimensionIdInput('programOrStageId.dimensionId')
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: undefined,
            })
        })

        it('parses program ID, stage ID, and dimension ID', () => {
            const result = parseDimensionIdInput(
                'programId.stageId.dimensionId'
            )
            expect(result).toEqual({
                ids: ['programId', 'stageId', 'dimensionId'],
                repetitionIndex: undefined,
            })
        })

        it('parses program/stage ID with repetition index and dimension ID', () => {
            const result = parseDimensionIdInput(
                'programOrStageId[0].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: '0',
            })
        })

        it('parses program/stage ID with different repetition index and dimension ID', () => {
            const result = parseDimensionIdInput(
                'programOrStageId[1].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: '1',
            })
        })

        it('parses program ID, stage ID with repetition index, and dimension ID', () => {
            const result = parseDimensionIdInput(
                'programId.stageId[2].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programId', 'stageId', 'dimensionId'],
                repetitionIndex: '2',
            })
        })

        it('parses multi-digit repetition index', () => {
            const result = parseDimensionIdInput(
                'programOrStageId[123].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: '123',
            })
        })
    })

    describe('invalid inputs', () => {
        it('throws error for empty string', () => {
            expect(() => parseDimensionIdInput('')).toThrow(
                'Dimension ID input is not a populated string'
            )
        })

        it('throws error for only repetition index without dimension', () => {
            expect(() => parseDimensionIdInput('[1]')).toThrow(
                'No valid dimension ID found in "[1]"'
            )
        })

        it('throws error for empty dimension after dot', () => {
            expect(() => parseDimensionIdInput('programId.')).toThrow(
                'No valid dimension ID found in "programId."'
            )
        })

        it('throws error for empty dimension with repetition index', () => {
            expect(() => parseDimensionIdInput('programId.[0]')).toThrow(
                'No valid dimension ID found in "programId.[0]"'
            )
        })

        it('throws error for double dots', () => {
            expect(() =>
                parseDimensionIdInput('programId..dimensionId')
            ).toThrow(
                'Invalid dimension ID format: empty ID found in "programId..dimensionId"'
            )
        })

        it('throws error for leading dot', () => {
            expect(() => parseDimensionIdInput('.dimensionId')).toThrow(
                'Invalid dimension ID format: empty ID found in ".dimensionId"'
            )
        })

        it('throws error for more than 3 IDs', () => {
            expect(() => parseDimensionIdInput('a.b.c.d')).toThrow(
                'Invalid dimension ID format: expected 1-3 IDs, got 4'
            )
        })
    })

    describe('repetition index values', () => {
        it('handles repetition index of zero', () => {
            const result = parseDimensionIdInput(
                'programOrStageId[0].dimensionId'
            )
            expect(result.repetitionIndex).toBe('0')
        })

        it('handles negative repetition index', () => {
            const result = parseDimensionIdInput(
                'programOrStageId[-1].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: '-1',
            })
        })

        it('extracts repetition index from anywhere in the string', () => {
            const result = parseDimensionIdInput(
                'programOrStageId[0].dimensionId'
            )
            expect(result).toEqual({
                ids: ['programOrStageId', 'dimensionId'],
                repetitionIndex: '0',
            })
        })
    })
})
