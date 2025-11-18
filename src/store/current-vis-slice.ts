import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { isVisualizationSaved } from '@modules/visualization'
import type { CurrentVisualization, VisualizationNameDescription } from '@types'

export const initialState = {} as CurrentVisualization

export const currentVisSlice = createSlice({
    name: 'currentVis',
    initialState,
    reducers: {
        clearCurrentVis: () => initialState,
        setCurrentVis: (state, action: PayloadAction<CurrentVisualization>) =>
            Object.assign(state, action.payload),
        setCurrentVisNameDescription: (
            state,
            action: PayloadAction<VisualizationNameDescription>
        ) => Object.assign(state, action.payload),
    },
    selectors: {
        getCurrentVis: (state) => state,
        getCurrentVisId: (state) =>
            isVisualizationSaved(state) ? state.id : null,
    },
})

export const { clearCurrentVis, setCurrentVis, setCurrentVisNameDescription } =
    currentVisSlice.actions
export const { getCurrentVis, getCurrentVisId } = currentVisSlice.selectors
