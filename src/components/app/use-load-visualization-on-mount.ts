import { useEffect } from 'react'
import { useAppDispatch, useAppStore } from '@hooks'
import { tLoadSavedVisualization } from '@store/thunks'

export const useLoadVisualizationOnMount = () => {
    const store = useAppStore()
    const dispatch = useAppDispatch()

    useEffect(() => {
        const { navigation } = store.getState()

        if (navigation.visualizationId !== 'new') {
            dispatch(tLoadSavedVisualization(navigation.visualizationId))
        }
    }, [dispatch, store])
}
