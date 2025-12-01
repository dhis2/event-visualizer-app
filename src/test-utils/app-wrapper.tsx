// eslint-disable-next-line no-restricted-imports
import { CustomDataProvider, useDataEngine } from '@dhis2/app-runtime'
import { CssVariables } from '@dhis2/ui'
import type { ReducersMapObject } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import { render, renderHook, waitFor } from '@testing-library/react'
import deepmerge from 'deepmerge'
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
import type { InitialMetadataItems } from '@components/app-wrapper/metadata-helpers/types'
import { MockMetadataProvider } from '@components/app-wrapper/metadata-provider'
import { useMetadataStore } from '@hooks'
import { currentVisSlice } from '@store/current-vis-slice'
import { loaderSlice } from '@store/loader-slice'
import { listenerMiddleware } from '@store/middleware-listener'
import { navigationSlice } from '@store/navigation-slice'
import { savedVisSlice } from '@store/saved-vis-slice'
import {
    createStore as createDefaultStore,
    getPreloadedState as getDefaultPreloadedState,
} from '@store/store'
import { uiSlice } from '@store/ui-slice'
import { visUiConfigSlice } from '@store/vis-ui-config-slice'
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
 * Used by both `MockAppWrapper` (Cypress component tests), `renderWithAppWrapper`,
 * and `renderHookWithAppWrapper` (Vitest unit tests) to wrap components in a
 * mocked version of the application context.
 */
export type MockOptions = {
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
    metadata?: InitialMetadataItems
    /**
     * Partial Redux store configuration for testing with custom state.
     * When provided, creates a store with the specified reducer and preloaded state.
     * The API reducer is automatically included. If not provided, the full
     * production store is used instead.
     */
    partialStore?: {
        /** Partial reducer map to merge with the API reducer. If not provided, the full app reducer is used. */
        reducer?: Partial<ReducersMapObject<RootState>>
        /** Initial state to preload into the store */
        preloadedState: Partial<RootState>
    }
}

type CustomDataProviderProps = React.ComponentProps<typeof CustomDataProvider>
type QueryData = CustomDataProviderProps['data']
type CreateStoreBaseParams = {
    engine: DataEngine
    metadataStore: MetadataStore
    appCachedData: AppCachedData
}
type CreatePartialStoreParams = CreateStoreBaseParams & {
    partialStore: NonNullable<MockOptions['partialStore']>
}
type CreatePartialOrDefaultStoreParams = CreateStoreBaseParams & {
    partialStore?: MockOptions['partialStore']
}

const fullAppReducer = {
    currentVis: currentVisSlice.reducer,
    loader: loaderSlice.reducer,
    navigation: navigationSlice.reducer,
    ui: uiSlice.reducer,
    visUiConfig: visUiConfigSlice.reducer,
    savedVis: savedVisSlice.reducer,
}

const createPartialStore = ({
    partialStore,
    engine,
    metadataStore,
    appCachedData,
}: CreatePartialStoreParams) => {
    return configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            ...(partialStore.reducer ?? fullAppReducer),
        } as ReducersMapObject<RootState>,
        preloadedState: deepmerge(
            getDefaultPreloadedState(appCachedData),
            partialStore.preloadedState
        ),
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: { engine, metadataStore, appCachedData },
                },
            })
                .prepend(listenerMiddleware.middleware)
                .concat(api.middleware),
    })
}

export type PartialAppStore = ReturnType<typeof createPartialStore>
export type PartialAppDispatch = PartialAppStore['dispatch']
export type PartialRootState = ReturnType<PartialAppStore['getState']>

type PartialOrDefaultStore = AppStore | PartialAppStore

const createPartialOrDefaultStore = ({
    partialStore,
    engine,
    metadataStore,
    appCachedData,
}: CreatePartialOrDefaultStoreParams): PartialOrDefaultStore =>
    partialStore
        ? createPartialStore({
              partialStore,
              engine,
              metadataStore,
              appCachedData,
          })
        : createDefaultStore(engine, metadataStore, appCachedData)

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
    )
    return (
        <Provider store={resolvedStore}>
            {typeof children === 'function'
                ? children(resolvedStore)
                : children}
        </Provider>
    )
}

const defaultAppCachedData = {
    me: meData,
    organisationUnitLevels: organisationUnitLevelsData,
    organisationUnits: organisationUnitsData,
    systemSettings: systemSettingsData,
}

const MockAppWrapperCore: FC<{
    children: ReactNode | ((store: PartialOrDefaultStore) => ReactNode)
    queryData?: QueryData
    metadata?: InitialMetadataItems
    partialStore?: MockOptions['partialStore']
}> = ({ children, queryData, metadata, partialStore }) => {
    return (
        <CustomDataProvider data={{ ...defaultAppCachedData, ...queryData }}>
            <CssVariables colors spacers theme />
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

const createMockWrapper = (mockOptions: MockOptions) => {
    let partialOrDefaultStore: PartialOrDefaultStore | null = null

    const Wrapper = ({ children }: PropsWithChildren) => (
        <MockAppWrapperCore {...mockOptions}>
            {(store) => {
                partialOrDefaultStore = store
                return children
            }}
        </MockAppWrapperCore>
    )

    const getStore = () => partialOrDefaultStore

    return { Wrapper, getStore }
}

const waitForStore = async (getStore: () => PartialOrDefaultStore | null) => {
    return await waitFor(() => {
        const store = getStore()
        if (!store) {
            throw new Error('Store not yet available')
        }
        return store
    })
}

// For usage in Cypress Component tests
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

// For usage in Vitests component tests
export const renderWithAppWrapper = async (
    ui: ReactElement,
    mockOptions: MockOptions = {}
) => {
    const { Wrapper, getStore } = createMockWrapper(mockOptions)
    const renderResult = render(ui, { wrapper: Wrapper })
    const store = await waitForStore(getStore)
    return { ...renderResult, store }
}

// For usage in Vitests hook tests
export const renderHookWithAppWrapper = async <TResult, TProps>(
    hook: (props: TProps) => TResult,
    mockOptions: MockOptions = {}
) => {
    const { Wrapper, getStore } = createMockWrapper(mockOptions)
    const renderHookResult = renderHook(hook, { wrapper: Wrapper })
    const store = await waitForStore(getStore)
    return { ...renderHookResult, store }
}
