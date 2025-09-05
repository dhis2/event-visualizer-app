import type { FC } from 'react'
import { useCallback } from 'react'
import { InterpretationsAndDetailsToggler as AnalyticsInterpretationsAndDetailsToggler } from '@dhis2/analytics'
import { useAppSelector, useAppDispatch } from '@hooks'
import { getCurrentVisId } from '@store/current-vis-slice'
import {
    getUiDetailsPanelVisible,
    setUiDetailsPanelVisible,
} from '@store/ui-slice'

export const InterpretationsAndDetailsToggler: FC = () => {
    const dispatch = useAppDispatch()

    const id = useAppSelector(getCurrentVisId)
    const isDetailsPanelVisible = useAppSelector(getUiDetailsPanelVisible)

    const onClick = useCallback(() => {
        dispatch(setUiDetailsPanelVisible(!isDetailsPanelVisible))
    }, [dispatch, isDetailsPanelVisible])

    return (
        <AnalyticsInterpretationsAndDetailsToggler
            disabled={!id}
            onClick={onClick}
            isShowing={isDetailsPanelVisible}
        />
    )
}
