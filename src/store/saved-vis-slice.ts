import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type {
    SavedVisualization,
    EmptyVisualization,
    VisualizationNameDescription,
} from '@types'

export type SavedVisState = SavedVisualization | EmptyVisualization

const makeInitialState = (): SavedVisState => ({})
export const initialState = makeInitialState()

export const savedVisSlice = createSlice({
    name: 'savedVis',
    initialState,
    reducers: {
        clearSavedVis: () => initialState,
        setSavedVis: (state, action: PayloadAction<SavedVisualization>) =>
            Object.assign(state, action.payload),
        setSavedVisNameDescription: (
            state,
            action: PayloadAction<VisualizationNameDescription>
        ) => Object.assign(state, action.payload),
    },
    selectors: {
        getSavedVis: (state) => state,
    },
})

export const { clearSavedVis, setSavedVis, setSavedVisNameDescription } =
    savedVisSlice.actions
export const { getSavedVis } = savedVisSlice.selectors
