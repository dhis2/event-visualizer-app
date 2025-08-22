import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { EventVisualization } from '@types'

type CurrentState = Partial<EventVisualization> | null

const initialState: CurrentState = null

export const currentSlice = createSlice({
    name: 'current',
    initialState,
    reducers: {
        setCurrent: (
            state: CurrentState,
            action: PayloadAction<CurrentState>
        ) => {
            state = action.payload
        },
    },
    selectors: {
        getCurrent: (state: CurrentState) => state ?? null,
        getCurrentId: (state: CurrentState) => state?.id ?? null,
    },
})

export const { setCurrent } = currentSlice.actions
