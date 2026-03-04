import { render, renderHook } from '@testing-library/react'
import type { PropsWithChildren, ReactElement } from 'react'
import { Provider } from 'react-redux'
import type { setupStore } from './setup-store'

export const renderWithReduxStoreProvider = (
    ui: ReactElement,
    store: ReturnType<typeof setupStore>
) => {
    const Wrapper = ({ children }: PropsWithChildren) => (
        <Provider store={store}>{children}</Provider>
    )

    return render(ui, { wrapper: Wrapper })
}

export const renderHookWithReduxStoreProvider = <TResult, TProps>(
    hook: (props: TProps) => TResult,
    store: ReturnType<typeof setupStore>
) => {
    const Wrapper = ({ children }: PropsWithChildren) => (
        <Provider store={store}>{children}</Provider>
    )

    return { ...renderHook(hook, { wrapper: Wrapper }), store }
}
