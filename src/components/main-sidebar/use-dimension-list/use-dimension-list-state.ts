import { useCallback, useLayoutEffect, useReducer, useRef } from 'react'
import type { EngineError } from '@api/parse-engine-error'
import type { DimensionMetadataItem } from '@types'

// State Machine Types
export type DimensionListStatus =
    | 'uninitialized' // Never attempted to fetch
    | 'initial-loading' // Initial fetch in progress
    | 'searching' // Search fetch in progress
    | 'idle' // Ready for actions (fetch complete)
    | 'loading-more' // Loading more data (pagination)
    | 'error' // Error state

export type DimensionListState = {
    status: DimensionListStatus
    dimensions: DimensionMetadataItem[]
    nextPage: number | null
    error?: EngineError
    hasNoData: boolean // True only when page 1, no search term, no data, no fixed dimensions
}

export type DimensionListAction =
    | { type: 'INITIAL_LOAD_START' }
    | {
          type: 'INITIAL_LOAD_SUCCESS'
          payload: {
              dimensions: DimensionMetadataItem[]
              nextPage: number | null
              searchTerm: string
              hasFixedDimensions: boolean
          }
      }
    | { type: 'SEARCH_START' }
    | {
          type: 'SEARCH_SUCCESS'
          payload: {
              dimensions: DimensionMetadataItem[]
              nextPage: number | null
              searchTerm: string
              hasFixedDimensions: boolean
          }
      }
    | { type: 'LOAD_MORE_START' }
    | {
          type: 'LOAD_MORE_SUCCESS'
          payload: {
              dimensions: DimensionMetadataItem[]
              nextPage: number | null
          }
      }
    | { type: 'ERROR'; payload: EngineError }
    | { type: 'RESET' }

export const initialDimensionListState: DimensionListState = {
    status: 'uninitialized',
    dimensions: [],
    nextPage: null,
    error: undefined,
    hasNoData: false,
}

export const dimensionListReducer = (
    state: DimensionListState,
    action: DimensionListAction
): DimensionListState => {
    switch (action.type) {
        case 'INITIAL_LOAD_START':
            return {
                ...state,
                status: 'initial-loading',
                error: undefined,
            }

        case 'INITIAL_LOAD_SUCCESS': {
            // hasNoData logic for initial load:
            // - If no search term: set hasNoData based on whether we got data
            // - If search term exists: hasNoData should be false (searching doesn't count as "no data")
            const hasNoData = !action.payload.searchTerm
                ? action.payload.dimensions.length === 0 &&
                  !action.payload.hasFixedDimensions
                : false

            return {
                status: 'idle',
                dimensions: action.payload.dimensions,
                nextPage: action.payload.nextPage,
                error: undefined,
                hasNoData,
            }
        }

        case 'SEARCH_START':
            return {
                ...state,
                status: 'searching',
                error: undefined,
            }

        case 'SEARCH_SUCCESS': {
            // hasNoData logic for search:
            // - If no search term (cleared): update hasNoData based on whether we got data
            // - If search term exists: keep existing hasNoData (sticky during search)
            const hasNoData = !action.payload.searchTerm
                ? action.payload.dimensions.length === 0 &&
                  !action.payload.hasFixedDimensions
                : state.hasNoData

            return {
                status: 'idle',
                dimensions: action.payload.dimensions,
                nextPage: action.payload.nextPage,
                error: undefined,
                hasNoData,
            }
        }

        case 'LOAD_MORE_START':
            return {
                ...state,
                status: 'loading-more',
                error: undefined,
            }

        case 'LOAD_MORE_SUCCESS':
            return {
                status: 'idle',
                dimensions: [...state.dimensions, ...action.payload.dimensions],
                nextPage: action.payload.nextPage,
                error: undefined,
                hasNoData: state.hasNoData, // Keep existing hasNoData
            }

        case 'ERROR':
            return {
                ...state,
                status: 'error',
                error: action.payload,
            }

        case 'RESET':
            return initialDimensionListState

        default:
            return state
    }
}

/**
 * Hook that manages dimension list state with a clean separation between:
 * - Reactive state (triggers effects when changed)
 * - Read-only state access (via getState, doesn't trigger effects)
 *
 * This pattern solves the problem of needing to access state in effects
 * without always wanting to re-run effects when that state changes.
 *
 * @param initialState - Initial state for the reducer
 * @returns Object containing:
 *   - state: Reactive state (use in dependency arrays to trigger effects)
 *   - getState: Stable function to read current state without triggering effects
 *   - Named action creators (onSearchStart, onError, etc.)
 */
export const useDimensionListState = (
    initialState: DimensionListState = initialDimensionListState
) => {
    const [state, dispatch] = useReducer(dimensionListReducer, initialState)

    // Store state in ref, updated via useLayoutEffect before other effects run
    // This ensures getState() always returns the freshest state
    const stateRef = useRef(state)
    useLayoutEffect(() => {
        stateRef.current = state
    }, [state])

    // Stable getter function - doesn't trigger effects when used in dependency arrays
    const getState = useCallback(() => stateRef.current, [])

    // Named action creators - provide clear, semantic API instead of raw dispatch
    const onInitialLoadStart = useCallback(
        () => dispatch({ type: 'INITIAL_LOAD_START' }),
        []
    )

    const onInitialLoadSuccess = useCallback(
        (payload: {
            dimensions: DimensionMetadataItem[]
            nextPage: number | null
            searchTerm: string
            hasFixedDimensions: boolean
        }) => dispatch({ type: 'INITIAL_LOAD_SUCCESS', payload }),
        []
    )

    const onSearchStart = useCallback(
        () => dispatch({ type: 'SEARCH_START' }),
        []
    )

    const onSearchSuccess = useCallback(
        (payload: {
            dimensions: DimensionMetadataItem[]
            nextPage: number | null
            searchTerm: string
            hasFixedDimensions: boolean
        }) => dispatch({ type: 'SEARCH_SUCCESS', payload }),
        []
    )

    const onLoadMoreStart = useCallback(
        () => dispatch({ type: 'LOAD_MORE_START' }),
        []
    )

    const onLoadMoreSuccess = useCallback(
        (payload: {
            dimensions: DimensionMetadataItem[]
            nextPage: number | null
        }) => dispatch({ type: 'LOAD_MORE_SUCCESS', payload }),
        []
    )

    const onError = useCallback(
        (error: EngineError) => dispatch({ type: 'ERROR', payload: error }),
        []
    )

    const onReset = useCallback(() => dispatch({ type: 'RESET' }), [])

    return {
        state, // Reactive - use in dependency arrays
        getState, // Read-only - doesn't trigger effects
        onInitialLoadStart,
        onInitialLoadSuccess,
        onSearchStart,
        onSearchSuccess,
        onLoadMoreStart,
        onLoadMoreSuccess,
        onError,
        onReset,
    }
}
