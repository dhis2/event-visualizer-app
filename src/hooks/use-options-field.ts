import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@hooks'
import { setVisUiConfigOption } from '@store/vis-ui-config-slice'
import type { EventVisualizationOptions } from '@types'

export function useOptionsField<K extends keyof EventVisualizationOptions>(
    key: K
) {
    const dispatch = useAppDispatch()
    const value = useAppSelector(
        (state) => state.visUiConfig.options[key]
    ) as EventVisualizationOptions[K]
    const setValue = useCallback(
        (value: EventVisualizationOptions[K]) => {
            dispatch(setVisUiConfigOption({ key, value }))
        },
        [key, dispatch]
    )
    return useMemo(() => [value, setValue] as const, [value, setValue])
}
