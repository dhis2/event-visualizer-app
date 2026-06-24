import { useCallback, useState } from 'react'
import type { FilterRadioMode } from './show-all-filter-radio'

type UseFilterRadioModeParams = {
    hasPersistedFilter: boolean
    onEnterShowAll: () => void
    onEnterFilter: () => void
}

type UseFilterRadioModeResult = {
    mode: FilterRadioMode
    onModeChange: (mode: FilterRadioMode) => void
    /* Force the mode without running the enter handlers. For callers that have
     * already rewritten the underlying filter state themselves (e.g. a Display
     * axis switch that resets the Filter to "Show all"). */
    resetMode: (mode: FilterRadioMode) => void
}

/* "Show all"/"Filter" is a pure view over existing filter state. The mode is
 * derived once on open from whether a filter is currently persisted, then held
 * locally. Switching to "Show all" clears the persisted filter (Update will
 * then save zero filters); switching back to "Filter" restores it from the
 * caller's local stash. */
export const useFilterRadioMode = ({
    hasPersistedFilter,
    onEnterShowAll,
    onEnterFilter,
}: UseFilterRadioModeParams): UseFilterRadioModeResult => {
    const [mode, setMode] = useState<FilterRadioMode>(
        hasPersistedFilter ? 'FILTER' : 'SHOW_ALL'
    )

    const onModeChange = useCallback(
        (nextMode: FilterRadioMode) => {
            if (nextMode === mode) {
                return
            }

            if (nextMode === 'SHOW_ALL') {
                onEnterShowAll()
            } else {
                onEnterFilter()
            }

            setMode(nextMode)
        },
        [mode, onEnterShowAll, onEnterFilter]
    )

    return { mode, onModeChange, resetMode: setMode }
}
