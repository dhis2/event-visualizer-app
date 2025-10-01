import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
    renderWithAppWrapper,
    renderHookWithAppWrapper,
} from '../render-with-app-wrapper'
import {
    useMetadataItem,
    useMetadataItems,
} from '@components/app-wrapper/metadata-provider'
import { useCurrentUser, useAppSelector, useRtkQuery } from '@hooks'
import { navigationSlice, setNavigationState } from '@store/navigation-slice'
import type { RootState } from '@store/store'

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
                    USER_ORGUNIT: { USER_ORGUNIT: 'Custom User Org Unit' },
                    CUSTOM_METADATA: {
                        CUSTOM_METADATA: 'Custom Test Metadata',
                    },
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
