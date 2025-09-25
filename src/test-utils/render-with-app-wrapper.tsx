// eslint-disable-next-line no-restricted-imports
import { CustomDataProvider, useDataEngine } from '@dhis2/app-runtime'
import type { ReducersMapObject, Store } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import {
    useMemo,
    type FC,
    type PropsWithChildren,
    type ReactElement,
    type ReactNode,
} from 'react'
import { Provider } from 'react-redux'
import { setupStore } from './setup-store'
import {
    AppCachedDataQueryProvider,
    useAppCachedDataQuery,
} from '@components/app-wrapper/app-cached-data-query-provider'
import type { AnyMetadataItemInput } from '@components/app-wrapper/metadata-helpers'
import {
    MockMetadataProvider,
    useMetadataStore,
} from '@components/app-wrapper/metadata-provider'
import { createStore as createDefaultSore } from '@store/store'
import type { RootState } from '@types'

type CustomDataProviderProps = React.ComponentProps<typeof CustomDataProvider>
type QueryData = CustomDataProviderProps['data']

const appCachedData = {
    someResource: {},
}

/* `MockAppWrapper` can be used in Cypress component tests.
 * `renderWithAppWrapper` can be used in Vitest unit tests.
 * Both alow wrapping a component/hook in a mocked version
 * of the app.
 * API responses can be mocked using `queryData`. The provided
 * object will be merged with a default, so that `AppCachedDataQueryProvider`
 * and its hooks works as expected. This also means that
 * app-cached-data can be customised this way.
 * Metadata will be extracted from the queryData, and merged
 * with the initialMetadata and the provided `metadata`
 * A `store` with `reducer` and `preloadedState` may be provided
 * in order to work with a partial store with preloaded state
 * in tests. If this is not provided the full production store
 * is used
 */
type MockOptions = {
    queryData?: QueryData
    metadata?: Record<string, AnyMetadataItemInput>
    store?: {
        reducer: Partial<ReducersMapObject<RootState>>
        preloadedState: Partial<RootState>
    }
}
const MockStoreProvider: FC<{
    children: ReactNode
    store?: MockOptions['store']
}> = ({ children, store }) => {
    const engine = useDataEngine()
    const metadataStore = useMetadataStore()
    const appCachedData = useAppCachedDataQuery()
    const resolvedStore = useMemo(
        () =>
            store
                ? setupStore(store.reducer, store.preloadedState)
                : createDefaultSore(engine, metadataStore, appCachedData),
        [store, engine, metadataStore, appCachedData]
    ) as Store
    return <Provider store={resolvedStore}>{children}</Provider>
}

export const MockAppWrapper = ({
    children,
    queryData,
    metadata,
    store,
}: MockOptions & { children: ReactNode }) => {
    // Feature: [X] Fall back to default store
    // Feature: [ ] Extract metadata from queryData
    // Feature: [ ] Ensure `appCachedData` is populated with the correct fixtures to populate `AppCachedDataQueryProvider`
    return (
        <CustomDataProvider data={{ ...appCachedData, ...queryData }}>
            <AppCachedDataQueryProvider>
                <MockMetadataProvider mockMetadata={metadata}>
                    <MockStoreProvider store={store}>
                        {children}
                    </MockStoreProvider>
                </MockMetadataProvider>
            </AppCachedDataQueryProvider>
        </CustomDataProvider>
    )
}

export const renderWithAppWrapper = (
    ui: ReactElement,
    mockOptions: MockOptions
) => {
    const Wrapper = ({ children }: PropsWithChildren) => (
        <MockAppWrapper {...mockOptions}>{children}</MockAppWrapper>
    )

    return render(ui, { wrapper: Wrapper })
}
