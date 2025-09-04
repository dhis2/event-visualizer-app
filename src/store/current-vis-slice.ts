import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { isSavedVisualization } from '@modules/visualization'
import type { CurrentVisualization } from '@types'

const initialState: CurrentVisualization = {}

export const currentVisSlice = createSlice({
    name: 'currentVis',
    initialState,
    reducers: {
        setCurrentVis: (state, action: PayloadAction<CurrentVisualization>) =>
            Object.assign(state, action.payload),
        clearCurrentVis: () => initialState,
    },
    selectors: {
        getCurrentVis: (state) => state,
        getCurrentVisId: (state) =>
            isSavedVisualization(state) ? state.id : null,
    },
})

export const { setCurrentVis, clearCurrentVis } = currentVisSlice.actions
export const { getCurrentVis, getCurrentVisId } = currentVisSlice.selectors
