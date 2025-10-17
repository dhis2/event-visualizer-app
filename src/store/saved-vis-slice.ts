import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { SavedVisualization, EmptyVisualization } from '@types'

export const initialState: SavedVisualization | EmptyVisualization = {}

export const savedVisSlice = createSlice({
    name: 'savedVis',
    initialState,
    reducers: {
        setSavedVis: (state, action: PayloadAction<SavedVisualization>) =>
            Object.assign(state, action.payload),
        clearSavedVis: () => initialState,
    },
    selectors: {
        getSavedVis: (state) => state,
    },
})

export const { setSavedVis, clearSavedVis } = savedVisSlice.actions
export const { getSavedVis } = savedVisSlice.selectors
