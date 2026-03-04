import { useCallback, useReducer } from 'react'
import type { EngineError } from '@api/parse-engine-error'
import type { DimensionMetadataItem } from '@types'

export type ListFetchState = {
    isUninitialized: boolean
    isLoading: boolean
    isFetching: boolean
    isLoadingMore: boolean
    fetchedDimensions: DimensionMetadataItem[]
    nextPage: number | null
    error?: EngineError
    hasNoData: boolean // True only when page 1, no search term, no data, no fixed dimensions
}
type FetchSuccessPayload = {
    dimensions: DimensionMetadataItem[]
    currentPage: number
    nextPage: number | null
    searchTerm: string
}
type FetchStartAction = {
    type: 'FETCH_START'
    payload: {
        page: number
    }
}
type FetchSuccessAction = {
    type: 'FETCH_SUCCESS'
    payload: FetchSuccessPayload
}
type FetchErrorAction = {
    type: 'FETCH_ERROR'
    payload: EngineError
}

type DimensionListAction =
    | FetchStartAction
    | FetchSuccessAction
    | FetchErrorAction

const initialDimensionListState: ListFetchState = {
    isUninitialized: true,
    isLoading: false,
    isFetching: false,
    isLoadingMore: false,
    fetchedDimensions: [],
    nextPage: null,
    error: undefined,
    hasNoData: false,
}

const reducer = (
    state: ListFetchState,
    action: DimensionListAction
): ListFetchState => {
    switch (action.type) {
        case 'FETCH_START':
            return {
                ...state,
                isUninitialized: false,
                isLoading: state.isUninitialized,
                isFetching: true,
                isLoadingMore: action.payload.page > 1,
                error: undefined,
            }

        case 'FETCH_SUCCESS': {
            return {
                ...state,
                isUninitialized: false,
                isLoading: false,
                isLoadingMore: false,
                isFetching: false,
                fetchedDimensions:
                    action.payload.currentPage === 1
                        ? action.payload.dimensions
                        : [
                              ...state.fetchedDimensions,
                              ...action.payload.dimensions,
                          ],
                nextPage: action.payload.nextPage,
                error: undefined,
                hasNoData: action.payload.searchTerm
                    ? state.hasNoData
                    : action.payload.dimensions.length === 0,
            }
        }

        case 'FETCH_ERROR':
            return {
                ...state,
                isUninitialized: false,
                isLoading: false,
                isLoadingMore: false,
                isFetching: false,
                error: action.payload,
            }
        default:
            return state
    }
}

export const useListFetchState = (
    initialState: ListFetchState = initialDimensionListState
) => {
    const [fetchState, dispatch] = useReducer(reducer, initialState)
    const onFetchStart = useCallback(
        (page: number) => dispatch({ type: 'FETCH_START', payload: { page } }),
        []
    )

    const onFetchSuccess = useCallback(
        (payload: FetchSuccessPayload) =>
            dispatch({ type: 'FETCH_SUCCESS', payload }),
        []
    )

    const onFetchError = useCallback(
        (error: EngineError) =>
            dispatch({ type: 'FETCH_ERROR', payload: error }),
        []
    )

    return {
        fetchState,
        onFetchStart,
        onFetchSuccess,
        onFetchError,
    }
}
