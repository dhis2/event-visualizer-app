import { configureStore, ReducersMapObject, Store } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import type { RootState } from '@types'
import React, { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { vi } from 'vitest'
import { UseRtkQueryResult } from '../hooks/use-rtk-query'

export const setupStore = (
    reducer: Partial<ReducersMapObject<RootState>>,
    preloadedState: Partial<RootState>
): {
    getState: () => Partial<RootState>
    dispatch: ReturnType<typeof configureStore>['dispatch']
    subscribe: ReturnType<typeof configureStore>['subscribe']
    replaceReducer: ReturnType<typeof configureStore>['replaceReducer']
} => {
    return configureStore({
        reducer: reducer as ReducersMapObject<RootState>,
        preloadedState,
    })
}

export const renderWithReduxStoreProvider = (
    ui: React.ReactElement,
    store: ReturnType<typeof setupStore>
) => {
    const Wrapper = ({ children }: PropsWithChildren) => (
        <Provider store={store as Store}>{children}</Provider>
    )

    return render(ui, { wrapper: Wrapper })
}

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
