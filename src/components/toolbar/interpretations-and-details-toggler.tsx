import type { FC } from 'react'
import { useCallback } from 'react'
import { InterpretationsAndDetailsToggler as AnalyticsInterpretationsAndDetailsToggler } from '@dhis2/analytics'
import { useAppSelector, useAppDispatch } from '@hooks'
import { getCurrentId } from '@store/current-slice'
import { getUiDetailsPanelOpen, setUiDetailsPanelOpen } from '@store/ui-slice'

export const InterpretationsAndDetailsToggler: FC = () => {
    const dispatch = useAppDispatch()

    const id = useAppSelector(getCurrentId)
    const isDetailsPanelOpen = useAppSelector(getUiDetailsPanelOpen)

    const onClick = useCallback(() => {
        dispatch(setUiDetailsPanelOpen(!isDetailsPanelOpen))
    }, [dispatch, isDetailsPanelOpen])

    return (
        <AnalyticsInterpretationsAndDetailsToggler
            disabled={!id}
            onClick={onClick}
            isShowing={isDetailsPanelOpen}
        />
    )
}
