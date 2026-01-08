import { render } from '@testing-library/react'
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
