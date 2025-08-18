import { createSlice } from '@reduxjs/toolkit'

export interface CurrentState {
    id: string
}

const initialState: CurrentState | null = null

export const currentSlice = createSlice({
    name: 'current',
    initialState,
    reducers: {},
    selectors: {
        getCurrentId: (state: CurrentState | null) => state?.id ?? null,
    },
})

//export const {
//} = currentSlice.actions
export const currentReducer = currentSlice.reducer
