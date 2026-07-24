import { isCurrentVisualizationPersisted } from '@modules/visualization/state'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { CurrentVisualization, EmptyVisualization } from '@types'

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
    },
    selectors: {
        getCurrentVis: (state) => state,
        getCurrentVisId: (state) =>
            isCurrentVisualizationPersisted(state) ? state.id : null,
    },
})

export const { clearCurrentVis, setCurrentVis } = currentVisSlice.actions
export const { getCurrentVis, getCurrentVisId } = currentVisSlice.selectors
