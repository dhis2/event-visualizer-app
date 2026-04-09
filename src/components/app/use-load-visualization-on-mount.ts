import { useAppDispatch, useAppStore } from '@hooks'
import { tLoadSavedVisualization } from '@store/thunks'
import { useEffect } from 'react'

export const useLoadVisualizationOnMount = () => {
    const store = useAppStore()
    const dispatch = useAppDispatch()

    useEffect(() => {
        const { navigation } = store.getState()

        if (navigation.visualizationId !== 'new') {
            dispatch(
                tLoadSavedVisualization({
                    id: navigation.visualizationId,
                    updateStatistics: true,
                })
            )
        }
    }, [dispatch, store])
}
