import {
    isVisualizationEmpty,
    isVisualizationSaved,
} from '@modules/visualization'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
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
        setCurrentVis: (state, action: PayloadAction<CurrentVisualization>) =>
            Object.assign(state, action.payload),
        setCurrentVisNameDescription: (
            state,
            action: PayloadAction<VisualizationNameDescription>
        ) => {
            if (isVisualizationEmpty(state)) {
                throw new Error('Cannot rename an empty visualization')
            }
            Object.assign(state, action.payload)
        },
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
