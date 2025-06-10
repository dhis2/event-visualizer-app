import type { Query, Mutation } from '@dhis2/app-service-data'
import type { BaseQueryApi } from '@reduxjs/toolkit/query'
import { vi } from 'vitest'
import type { DataEngine } from '../types/data-engine'
import { customBaseQuery } from './custom-base-query'

describe('customBaseQuery', () => {
    // Minimal mock for BaseQueryApi
    const baseQueryApiMock = {} as BaseQueryApi
    const mockQueryResult = { foo: 'bar' }
    const mockMutationResult = { baz: 'qux' }

    const queryArgs: Query = { me: { resource: 'users', params: { id: 1 } } }
    const mutationArgs: Mutation = {
        type: 'create',
        resource: 'users',
        data: { name: 'Alice' },
    }

    let engine: DataEngine

    beforeEach(() => {
        engine = {
            query: vi.fn().mockResolvedValue(mockQueryResult),
            mutate: vi.fn().mockResolvedValue(mockMutationResult),
        } as unknown as DataEngine
    })

    it('returns data for a successful query', async () => {
        const result = await customBaseQuery(queryArgs, baseQueryApiMock, {
            meta: { engine },
        })
        expect(engine.query).toHaveBeenCalledWith(queryArgs)
        expect(result).toEqual({ data: mockQueryResult })
    })

    it('returns data for a successful mutation', async () => {
        const result = await customBaseQuery(mutationArgs, baseQueryApiMock, {
            meta: { engine },
        })
        expect(engine.mutate).toHaveBeenCalledWith(mutationArgs)
        expect(result).toEqual({ data: mockMutationResult })
    })

    it('returns empty object if result is nullish', async () => {
        const queryMock = engine.query as ReturnType<typeof vi.fn>
        queryMock.mockResolvedValueOnce(undefined)
        const result = await customBaseQuery(queryArgs, baseQueryApiMock, {
            meta: { engine },
        })
        expect(result).toEqual({ data: {} })
    })

    it('returns error if engine is missing', async () => {
        const result = await customBaseQuery(queryArgs, baseQueryApiMock, {
            meta: { engine: undefined as unknown },
        })
        expect(result).toEqual({
            error: {
                status: 'CUSTOM_ERROR',
                data: 'DataEngine not available',
            },
        })
    })

    it('returns error if query throws', async () => {
        const errorMsg = 'Query failed'
        const queryMock = engine.query as ReturnType<typeof vi.fn>
        queryMock.mockRejectedValueOnce(new Error(errorMsg))
        const result = await customBaseQuery(queryArgs, baseQueryApiMock, {
            meta: { engine },
        })
        expect(result).toEqual({
            error: {
                status: 'CUSTOM_ERROR',
                data: errorMsg,
            },
        })
    })

    it('returns error if mutation throws non-Error', async () => {
        const mutateMock = engine.mutate as ReturnType<typeof vi.fn>
        mutateMock.mockRejectedValueOnce('fail')
        const result = await customBaseQuery(mutationArgs, baseQueryApiMock, {
            meta: { engine },
        })
        expect(result).toEqual({
            error: {
                status: 'CUSTOM_ERROR',
                data: 'Unknown error',
            },
        })
    })
})
