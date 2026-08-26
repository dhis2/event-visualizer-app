import { getNavigationStateFromLocation } from '@modules/history'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export interface NavigationState {
    visualizationId: string | 'new'
    interpretationId: string | null
}

export const initialState: NavigationState = getNavigationStateFromLocation()

export const navigationSlice = createSlice({
    name: 'navigation',
    initialState,
    reducers: {
        setNavigationState: (
            state,
            action: PayloadAction<{
                visualizationId: string | 'new'
                interpretationId?: string | null
            }>
        ) => {
            state.visualizationId = action.payload.visualizationId
            state.interpretationId = action.payload.interpretationId ?? null
        },
        setNavigationInterpretationId: (
            state,
            action: PayloadAction<string | null>
        ) => {
            state.interpretationId = action.payload
        },
    },
    selectors: {
        getNavigationInterpretationId: (state) => state.interpretationId,
    },
})

export const { setNavigationState, setNavigationInterpretationId } =
    navigationSlice.actions
export const { getNavigationInterpretationId } = navigationSlice.selectors
