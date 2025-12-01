import { FetchError } from '@dhis2/app-runtime'
import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithAppWrapper, renderHookWithAppWrapper } from '../app-wrapper'
import {
    useCurrentUser,
    useAppSelector,
    useRtkQuery,
    useMetadataItem,
    useMetadataItems,
} from '@hooks'
import { navigationSlice, setNavigationState } from '@store/navigation-slice'
import type { RootState } from '@store/store'
import { suppressConsoleError } from '@test-utils/suppress-console-error'

/* renderWithAppWrapper and renderHookWithAppWrapper are virtually identical and
 * renderHookWithAppWrapper is much more convenient to test. So the bulk of the
 * functionality is implemented there. */
describe('renderWithAppWrapper', () => {
    const TestComponent = () => {
        const currentUser = useCurrentUser()
        const userOrgUnitMetadata = useMetadataItem('USER_ORGUNIT')
        const apiState = useAppSelector((state: RootState) => state.api)

        return (
            <div>
                <div data-test="current-user">
                    {currentUser?.username || 'No User'}
                </div>
                <div data-test="metadata">
                    {userOrgUnitMetadata?.name || 'No Metadata'}
                </div>
                <div data-test="has-api-state">{String(Boolean(apiState))}</div>
            </div>
        )
    }

    it('should render component with access to the wrapper hooks', async () => {
        const { store } = await renderWithAppWrapper(<TestComponent />, {})

        expect(store).toBeDefined()
        expect(store).not.toBeNull()
        if (store) {
            expect(typeof store.getState).toBe('function')
            expect(typeof store.dispatch).toBe('function')
            expect(typeof store.subscribe).toBe('function')
        }

        expect(screen.getByTestId('current-user')).toHaveTextContent('admin')
        expect(screen.getByTestId('metadata')).toHaveTextContent(
            'User organisation unit'
        )
        expect(screen.getByTestId('has-api-state')).toHaveTextContent('true')
    })
})

describe('renderHookWithAppWrapper', () => {
    it('should provide default mocked context with store access', async () => {
        const { result, store } = await renderHookWithAppWrapper(() => ({
            currentUser: useCurrentUser(),
            userOrgUnit: useMetadataItem('USER_ORGUNIT'),
        }))

        expect(store).toBeDefined()
        expect(store).not.toBeNull()
        expect(typeof store.getState).toBe('function')
        expect(typeof store.dispatch).toBe('function')

        const storeState = store.getState()
        expect(Object.keys(storeState)).toContain('api')

        expect(result.current.currentUser.username).toBe('admin')
        expect(result.current.userOrgUnit?.name).toBe('User organisation unit')
    })

    it('should merge custom queryData with default app cached data', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useCurrentUser(),
            {
                queryData: {
                    me: { username: 'custom-test-user', name: 'Custom User' },
                },
            }
        )

        expect(result.current.username).toBe('custom-test-user')
        expect(result.current.name).toBe('Custom User')
    })

    it('should overwrite default metadata and add custom metadata', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useMetadataItems(['USER_ORGUNIT', 'CUSTOM_METADATA']),
            {
                metadata: {
                    USER_ORGUNIT: 'Custom User Org Unit',
                    CUSTOM_METADATA: 'Custom Test Metadata',
                },
            }
        )

        expect(result.current?.USER_ORGUNIT.name).toBe('Custom User Org Unit')
        // Custom metadata should be available
        expect(result.current?.CUSTOM_METADATA.name).toBe(
            'Custom Test Metadata'
        )
    })

    it('should support partial store configuration', async () => {
        const customReducer = {
            navigation: navigationSlice.reducer,
        }
        const preloadedState = {
            navigation: {
                visualizationId: 'test-viz-123',
                interpretationId: 'test-interp-456',
            },
        }

        const { result } = await renderHookWithAppWrapper(
            () => useAppSelector((state) => state.navigation),
            {
                partialStore: {
                    reducer: customReducer,
                    preloadedState,
                },
            }
        )

        expect(result.current.visualizationId).toBe('test-viz-123')
        expect(result.current.interpretationId).toBe('test-interp-456')
    })

    it('should use only custom reducer plus API reducer when partialStore.reducer is provided', async () => {
        const customReducer = {
            navigation: navigationSlice.reducer,
        }
        const { store } = await renderHookWithAppWrapper(
            () => useAppSelector((state) => state),
            {
                partialStore: {
                    reducer: customReducer,
                    preloadedState: {},
                },
            }
        )

        const state = store.getState()
        // Should have the custom navigation reducer
        expect(state.navigation).toBeDefined()
        // Should have the API reducer
        expect(state.api).toBeDefined()
        // Should not have other app reducers since only partial reducer is provided
        expect(state.visUiConfig).toBeUndefined()
        expect(state.currentVis).toBeUndefined()
    })

    it('should use full app reducer when partialStore.reducer is not provided', async () => {
        const { store } = await renderHookWithAppWrapper(
            () => useAppSelector((state) => state),
            {
                partialStore: {
                    preloadedState: {},
                },
            }
        )

        const state = store.getState()
        // Should have all full app reducers
        expect(state.api).toBeDefined()
        expect(state.visUiConfig).toBeDefined()
        expect(state.currentVis).toBeDefined()
        expect(state.navigation).toBeDefined()
        expect(state.loader).toBeDefined()
        expect(state.ui).toBeDefined()
        expect(state.savedVis).toBeDefined()
    })

    it('should apply default preloaded state and merge with custom preloadedState', async () => {
        const customPreloadedState = {
            navigation: {
                visualizationId: 'custom-viz',
                interpretationId: null,
            },
        }

        const { result } = await renderHookWithAppWrapper(
            () => ({
                navigation: useAppSelector((state) => state.navigation),
                visUiConfig: useAppSelector((state) => state.visUiConfig),
            }),
            {
                partialStore: {
                    preloadedState: customPreloadedState,
                },
            }
        )

        // Custom preloaded state should be applied
        expect(result.current.navigation.visualizationId).toBe('custom-viz')
        // Default preloaded state should be applied (visUiConfig with options)
        expect(result.current.visUiConfig.options).toBeDefined()
        expect(result.current.visUiConfig.options.digitGroupSeparator).toBe(
            'NONE'
        )
    })

    it('should allow RTK Query with mocked queryData', async () => {
        const testData = { a: 'a', b: 'b' }
        const { result } = await renderHookWithAppWrapper(
            () => useRtkQuery({ resource: 'testResource' }),
            {
                queryData: {
                    testResource: testData,
                },
            }
        )
        expect(result.current.isLoading).toBe(true)
        expect(result.current.data).toBeUndefined()

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
            expect(result.current.data).toEqual(testData)
        })
    })

    it(
        'allows simulating network errors by throwing a FetchError in a queryData callback property',
        suppressConsoleError('Oopsie', async () => {
            const dataCallback = () => {
                // If needed, you can also specify `details` here, see:
                // https://github.com/dhis2/app-runtime/blob/master/services/data/src/engine/types/FetchError.ts
                throw new FetchError({ message: 'Oopsie', type: 'network' })
            }
            const { result } = await renderHookWithAppWrapper(
                () => useRtkQuery({ resource: 'testResource' }),
                {
                    queryData: {
                        testResource: dataCallback,
                    },
                }
            )
            expect(result.current.isLoading).toBe(true)
            expect(result.current.data).toBeUndefined()

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
                expect(result.current.data).toBeUndefined()
                expect(result.current.error?.type).toBe('network')
                expect(result.current.error?.message).toBe('Oopsie')
            })
        })
    )

    it('should allow store manipulation and trigger re-renders', async () => {
        const customReducer = {
            navigation: navigationSlice.reducer,
        }
        const preloadedState = {
            navigation: {
                visualizationId: 'initial-viz',
                interpretationId: null,
            },
        }

        const { result, store } = await renderHookWithAppWrapper(
            () => useAppSelector((state) => state.navigation),
            {
                partialStore: {
                    reducer: customReducer,
                    preloadedState,
                },
                // This test will trigger the action listener middleware to fire some requests
                // By adding some response data here, we prevent errors to clutter the console
                queryData: {
                    eventVisualizations: {},
                    dataStatistics: {},
                },
            }
        )

        // Verify initial state
        expect(result.current.visualizationId).toBe('initial-viz')
        expect(result.current.interpretationId).toBe(null)

        // Dispatch action to update the store
        store.dispatch(
            setNavigationState({
                visualizationId: 'updated-viz',
                interpretationId: 'new-interpretation',
            })
        )

        // Wait for the state change to propagate and trigger re-render
        await waitFor(() => {
            expect(result.current.visualizationId).toBe('updated-viz')
            expect(result.current.interpretationId).toBe('new-interpretation')
        })
    })
})
