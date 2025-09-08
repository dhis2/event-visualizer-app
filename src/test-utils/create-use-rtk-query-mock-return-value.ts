import { vi } from 'vitest'
import type { UseRtkQueryResult } from '@hooks'

export const createUseRtkQueryMockReturnValue = (
    payload: Partial<UseRtkQueryResult>
): UseRtkQueryResult => {
    return {
        data: {},
        refetch: vi.fn(),
        isLoading: false,
        isError: false,
        error: undefined,
        ...payload,
    } as UseRtkQueryResult
}
