import { Store } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import { PropsWithChildren } from 'react'
import type { ReactElement } from 'react'
import { Provider } from 'react-redux'
import { setupStore } from './setup-store'

export const renderWithReduxStoreProvider = (
    ui: ReactElement,
    store: ReturnType<typeof setupStore>
) => {
    const Wrapper = ({ children }: PropsWithChildren) => (
        <Provider store={store as Store}>{children}</Provider>
    )

    return render(ui, { wrapper: Wrapper })
}
