import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type FC,
    type ReactNode,
} from 'react'

type AnchorContextValue = {
    anchorEl: HTMLElement | null
    setAnchorEl: (el: HTMLElement | null) => void
}

const noopAnchorContext: AnchorContextValue = {
    anchorEl: null,
    setAnchorEl: () => undefined,
}

const DimensionDialogAnchorContext =
    createContext<AnchorContextValue>(noopAnchorContext)

export const DimensionDialogAnchorProvider: FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [anchorEl, setAnchorElState] = useState<HTMLElement | null>(null)
    const setAnchorEl = useCallback((el: HTMLElement | null) => {
        setAnchorElState(el)
    }, [])
    const value = useMemo(
        () => ({ anchorEl, setAnchorEl }),
        [anchorEl, setAnchorEl]
    )
    return (
        <DimensionDialogAnchorContext.Provider value={value}>
            {children}
        </DimensionDialogAnchorContext.Provider>
    )
}

export const useDimensionDialogAnchor = (): AnchorContextValue =>
    useContext(DimensionDialogAnchorContext)
