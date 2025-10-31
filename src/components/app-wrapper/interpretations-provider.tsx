import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    type FC,
    type ReactNode,
} from 'react'
import { InterpretationsProvider as AnalyticsInterpretationsProvider } from '@dhis2/analytics'
import { useAppDispatch, useAppSelector, useCurrentUser } from '@hooks'
import {
    getNavigationInterpretationId,
    setNavigationInterpretationId,
} from '@store/navigation-slice'

const InterpretationModalProvider = createContext({
    current: false,
})

export const InterpretationsProvider: FC<{ children: ReactNode }> = ({
    children,
}) => {
    const currentUser = useCurrentUser()
    const initalFocusRef = useRef<boolean>(false)

    return (
        <InterpretationModalProvider.Provider value={initalFocusRef}>
            <AnalyticsInterpretationsProvider currentUser={currentUser}>
                {children}
            </AnalyticsInterpretationsProvider>
        </InterpretationModalProvider.Provider>
    )
}

export const useInterpretationModalTogglers = () => {
    const dispatch = useAppDispatch()
    const initialFocusRef = useContext(InterpretationModalProvider)
    const openInterpretationModal = useCallback(
        (interpretationId: string, initalFocus?: boolean) => {
            initialFocusRef.current = !!initalFocus
            dispatch(setNavigationInterpretationId(interpretationId))
        },
        [dispatch, initialFocusRef]
    )
    const onCloseInterpretationModal = useCallback(() => {
        initialFocusRef.current = false
        dispatch(setNavigationInterpretationId(null))
    }, [dispatch, initialFocusRef])
    const api = useMemo(
        () => ({ openInterpretationModal, onCloseInterpretationModal }),
        [openInterpretationModal, onCloseInterpretationModal]
    )
    return api
}

export const useInterpretationModalState = () => {
    const initialFocusRef = useContext(InterpretationModalProvider)
    const interpretationId = useAppSelector(getNavigationInterpretationId)
    return {
        interpretationId,
        initialFocus: initialFocusRef.current,
    }
}
