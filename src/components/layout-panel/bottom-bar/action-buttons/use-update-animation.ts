import { useAppDispatch, useAppSelector } from '@hooks'
import { getIsCurrentVisCustomValueList } from '@store/current-vis-slice'
import {
    getUiUpdateAnimationShowingFor,
    setUiUpdateAnimationShowingFor,
} from '@store/ui-slice'
import type { OutputType } from '@types'
import { useEffect, useMemo } from 'react'

/* Must match the animation duration in update-sync-icon.module.css. */
const ANIMATION_DURATION_MS = 500

/* The update thunk records which output type's button just updated. The matching
 * button's icon spins, then this hook clears the flag so the same className can
 * be re-applied — and the CSS animation replayed — on the next update. */
export const useUpdateAnimation = (
    buttonType: OutputType,
    isCustomValueButton?: boolean
) => {
    const dispatch = useAppDispatch()
    const showingFor = useAppSelector(getUiUpdateAnimationShowingFor)
    const isCurrentVisCustomValueList = useAppSelector(
        getIsCurrentVisCustomValueList
    )

    const isAnimating = useMemo(() => {
        if (!showingFor || showingFor !== buttonType) {
            return false
        }
        if (buttonType === 'EVENT') {
            return (
                (isCustomValueButton && isCurrentVisCustomValueList) ||
                (!isCustomValueButton && !isCurrentVisCustomValueList)
            )
        }
        return true
    }, [
        showingFor,
        buttonType,
        isCustomValueButton,
        isCurrentVisCustomValueList,
    ])

    useEffect(() => {
        if (!isAnimating) {
            return
        }
        const timeoutId = setTimeout(() => {
            dispatch(setUiUpdateAnimationShowingFor(null))
        }, ANIMATION_DURATION_MS)
        return () => clearTimeout(timeoutId)
    }, [isAnimating, dispatch])

    return { isAnimating }
}
