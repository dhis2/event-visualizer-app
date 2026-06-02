import {
    isCurrentVisualizationPersisted,
    isVisualizationEmpty,
} from '@modules/visualization'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import type {
    CurrentVisualization,
    EmptyVisualization,
    VisualizationNameDescription,
} from '@types'

export type CurrentVisState = CurrentVisualization | EmptyVisualization

const makeInitialState = (): CurrentVisState => ({})
export const initialState = makeInitialState()

export const currentVisSlice = createSlice({
    name: 'currentVis',
    initialState,
    reducers: {
        clearCurrentVis: () => initialState,
        /**
         * Explicit object spreading ensures a new reference is always created,
         * bypassing two optimization mechanisms:
         * 1. RTK Query's caching: Returns the same object reference for
         *    structurally identical data, even with forceRefetch: true
         * 2. Immer's structural sharing: Returns the original reference when
         *    mutations don't change values
         * Without spreading, reloading the same visualization would maintain
         * referential equality, preventing React effects from triggering.
         */
        setCurrentVis: (
            state,
            action: PayloadAction<CurrentVisualization>
        ) => ({ ...state, ...action.payload }),
        setCurrentVisNameDescription: (
            state,
            action: PayloadAction<VisualizationNameDescription>
        ) => {
            if (isVisualizationEmpty(state)) {
                throw new Error('Cannot rename an empty visualization')
            }
            return { ...state, ...action.payload }
        },
    },
    selectors: {
        getCurrentVis: (state) => state,
        getCurrentVisId: (state) =>
            isCurrentVisualizationPersisted(state) ? state.id : null,
    },
})

export const { clearCurrentVis, setCurrentVis, setCurrentVisNameDescription } =
    currentVisSlice.actions
export const { getCurrentVis, getCurrentVisId } = currentVisSlice.selectors

export const getCurrentVisLayoutKey = createSelector(getCurrentVis, (vis) =>
    [
        vis.outputType ?? '',
        ...[
            ...(vis.columns ?? []),
            ...(vis.rows ?? []),
            ...(vis.filters ?? []),
        ].map((d) => d.dimension),
    ].join('|')
)
