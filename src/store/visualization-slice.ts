import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { EventVisualization } from '@types'

type VisualizationState = EventVisualization | null

const initialState: VisualizationState = null

export const visualizationSlice = createSlice({
    name: 'visualization',
    initialState,
    reducers: {
        setVisualization: (
            state: VisualizationState,
            action: PayloadAction<VisualizationState>
        ) => {
            state = action.payload
        },
    },
    selectors: {
        getVisualization: (state: VisualizationState) => state ?? null,
    },
})

export const { setVisualization } = visualizationSlice.actions
