import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface NavigationState {
    visualizationId: string | 'new'
    interpretationId: string | null
}

const initialState: NavigationState = {
    visualizationId: 'new',
    interpretationId: null,
}

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
    },
})

export const { setNavigationState } = navigationSlice.actions
export const navigationReducer = navigationSlice.reducer
