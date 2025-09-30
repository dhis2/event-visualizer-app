// eslint-disable-next-line no-restricted-imports
import { CustomDataProvider, useDataEngine } from '@dhis2/app-runtime'
import type { ReducersMapObject, Store } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import { render, renderHook } from '@testing-library/react'
import {
    useMemo,
    type FC,
    type PropsWithChildren,
    type ReactElement,
    type ReactNode,
} from 'react'
import { Provider } from 'react-redux'
import meData from './__fixtures__/me.json'
import organisationUnitLevelsData from './__fixtures__/organisation-unit-levels.json'
import organisationUnitsData from './__fixtures__/organisation-units.json'
import systemSettingsData from './__fixtures__/system-settings.json'
import { api } from '@api/api'
import {
    AppCachedDataQueryProvider,
    useAppCachedDataQuery,
} from '@components/app-wrapper/app-cached-data-query-provider'
import type { AnyMetadataItemInput } from '@components/app-wrapper/metadata-helpers'
import {
    MockMetadataProvider,
    useMetadataStore,
} from '@components/app-wrapper/metadata-provider'
import { listenerMiddleware } from '@store/middleware-listener'
import { createStore as createDefaultSore } from '@store/store'
import type {
    RootState,
    AppCachedData,
    DataEngine,
    MetadataStore,
    AppStore,
} from '@types'

/**
 * Configuration options for mocking the app wrapper in tests.
 *
 * Used by both `MockAppWrapper` (Cypress component tests) and
 * `renderWithAppWrapper` (Vitest unit tests) to wrap components
 * in a mocked version of the application context.
 */
type MockOptions = {
    /**
     * Mock API response data that will be merged with default app-cached data.
     * This allows customization of data returned by `AppCachedDataQueryProvider`
     * and its associated hooks.
     */
    queryData?: QueryData
    /**
     * Mock metadata entries that will be merged with the initial metadata store.
     * Typically not required as middleware/hooks that fetch visualization or
     * analytics data will automatically populate the metadata store.
     */
    metadata?: Record<string, AnyMetadataItemInput>
    /**
     * Partial Redux store configuration for testing with custom state.
     * When provided, creates a store with the specified reducer and preloaded state.
     * The API reducer is automatically included. If not provided, the full
     * production store is used instead.
     */
    partialStore?: {
        /** Partial reducer map to merge with the API reducer */
        reducer: Partial<ReducersMapObject<RootState>>
        /** Initial state to preload into the store */
        preloadedState: Partial<RootState>
    }
}

type CustomDataProviderProps = React.ComponentProps<typeof CustomDataProvider>
type QueryData = CustomDataProviderProps['data']
type CreatePartialOrDefaultStoreParams = {
    partialStore: MockOptions['partialStore']
    engine: DataEngine
    metadataStore: MetadataStore
    appCachedData: AppCachedData
}
type PartialOrDefaultStore =
    | AppStore
    | {
          getState: () => Partial<RootState>
          dispatch: ReturnType<typeof configureStore>['dispatch']
          subscribe: ReturnType<typeof configureStore>['subscribe']
          replaceReducer: ReturnType<typeof configureStore>['replaceReducer']
      }

const defaultAppCachedData = {
    me: meData,
    organisationUnitLevels: organisationUnitLevelsData,
    organisationUnits: organisationUnitsData,
    systemSettings: systemSettingsData,
}

const createPartialOrDefaultStore = ({
    partialStore,
    engine,
    metadataStore,
    appCachedData,
}: CreatePartialOrDefaultStoreParams): PartialOrDefaultStore =>
    partialStore
        ? configureStore({
              reducer: {
                  [api.reducerPath]: api.reducer,
                  ...partialStore.reducer,
              } as ReducersMapObject<RootState>,
              preloadedState: partialStore.preloadedState,
              middleware: (getDefaultMiddleware) =>
                  getDefaultMiddleware({
                      thunk: {
                          extraArgument: {
                              engine,
                              metadataStore,
                              appCachedData,
                          },
                      },
                  })
                      .prepend(listenerMiddleware.middleware)
                      .concat(api.middleware),
          })
        : createDefaultSore(engine, metadataStore, appCachedData)

const MockStoreProvider: FC<{
    children: ReactNode | ((store: PartialOrDefaultStore) => ReactNode)
    partialStore: MockOptions['partialStore']
}> = ({ children, partialStore }) => {
    const engine = useDataEngine()
    const metadataStore = useMetadataStore()
    const appCachedData = useAppCachedDataQuery()
    const resolvedStore = useMemo(
        () =>
            createPartialOrDefaultStore({
                partialStore,
                engine,
                metadataStore,
                appCachedData,
            }),
        [partialStore, engine, metadataStore, appCachedData]
    ) as Store
    return (
        <Provider store={resolvedStore}>
            {typeof children === 'function'
                ? children(resolvedStore)
                : children}
        </Provider>
    )
}

const MockAppWrapperCore: FC<{
    children: ReactNode | ((store: PartialOrDefaultStore) => ReactNode)
    queryData?: QueryData
    metadata?: Record<string, AnyMetadataItemInput>
    partialStore?: MockOptions['partialStore']
}> = ({ children, queryData, metadata, partialStore }) => {
    return (
        <CustomDataProvider data={{ ...defaultAppCachedData, ...queryData }}>
            <AppCachedDataQueryProvider>
                <MockMetadataProvider mockMetadata={metadata}>
                    <MockStoreProvider partialStore={partialStore}>
                        {children}
                    </MockStoreProvider>
                </MockMetadataProvider>
            </AppCachedDataQueryProvider>
        </CustomDataProvider>
    )
}

export const MockAppWrapper = ({
    children,
    queryData,
    metadata,
    partialStore,
}: MockOptions & { children: ReactNode }) => {
    return (
        <MockAppWrapperCore
            queryData={queryData}
            metadata={metadata}
            partialStore={partialStore}
        >
            {children}
        </MockAppWrapperCore>
    )
}

export const renderWithAppWrapper = (
    ui: ReactElement,
    mockOptions: MockOptions
) => {
    let partialOrDefaultStore: PartialOrDefaultStore | null = null

    const Wrapper = ({ children }: PropsWithChildren) => (
        <MockAppWrapperCore {...mockOptions}>
            {(store) => {
                partialOrDefaultStore = store
                return children
            }}
        </MockAppWrapperCore>
    )

    const renderResult = render(ui, { wrapper: Wrapper })
    return { ...renderResult, store: partialOrDefaultStore }
}

/**
 * Renders a hook with the mocked app wrapper context.
 * Similar to `renderWithAppWrapper` but specifically for testing hooks.
 */
export const renderHookWithAppWrapper = <TResult, TProps>(
    hook: (props: TProps) => TResult,
    mockOptions: MockOptions = {}
) => {
    let partialOrDefaultStore: PartialOrDefaultStore | null = null

    const Wrapper = ({ children }: PropsWithChildren) => (
        <MockAppWrapperCore {...mockOptions}>
            {(store) => {
                partialOrDefaultStore = store
                return children
            }}
        </MockAppWrapperCore>
    )

    const hookResult = renderHook(hook, { wrapper: Wrapper })
    return { ...hookResult, store: partialOrDefaultStore }
}
