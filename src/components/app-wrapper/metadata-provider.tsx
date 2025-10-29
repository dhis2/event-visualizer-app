import {
    createContext,
    useContext,
    useState,
    useCallback,
    useSyncExternalStore,
    useMemo,
    useRef,
} from 'react'
import type { FC, ReactNode } from 'react'
import type {
    MetadataStoreItem,
    AnyMetadataItemInput,
} from './metadata-helpers'
import { getInitialMetadata } from './metadata-helpers/initial-metadata'
import { MetadataStore } from './metadata-store'
import { useRootOrgUnits } from '@hooks'

const MetadataContext = createContext<MetadataStore | null>(null)

export const MetadataProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const rootOrgUnits = useRootOrgUnits()
    const [metadataStore] = useState(
        () => new MetadataStore(getInitialMetadata(), rootOrgUnits)
    )
    return (
        <MetadataContext.Provider value={metadataStore}>
            {children}
        </MetadataContext.Provider>
    )
}

export const MockMetadataProvider: FC<{
    children: ReactNode
    mockMetadata?: Record<string, AnyMetadataItemInput>
}> = ({ children, mockMetadata }) => {
    const rootOrgUnits = useRootOrgUnits()
    const [metadataStore] = useState(
        () =>
            new MetadataStore(
                { ...getInitialMetadata(), ...mockMetadata },
                rootOrgUnits
            )
    )
    return (
        <MetadataContext.Provider value={metadataStore}>
            {children}
        </MetadataContext.Provider>
    )
}

export const useMetadataItem = (
    metadataId: string
): MetadataStoreItem | undefined => {
    const metadataStore = useContext(MetadataContext)!
    const result = useSyncExternalStore(
        useCallback(
            (callback) => metadataStore.subscribe(metadataId, callback),
            [metadataStore, metadataId]
        ),
        () => metadataStore.getMetadataItem(metadataId)
    )
    return result
}

export const useMetadataItems = (
    metadataIds: string[]
): Record<string, MetadataStoreItem> => {
    const metadataStore = useContext(MetadataContext)!
    // Sort keys for stable dependency array
    const sortedMetadataIds = useMemo(
        () => [...metadataIds].sort(),
        [metadataIds]
    )

    // Cache the last snapshot to ensure stable reference
    const lastSnapshotRef = useRef<{
        ids: string[]
        values: Record<string, MetadataStoreItem>
    }>({
        ids: [],
        values: {},
    })

    const getSnapshot = useCallback(() => {
        const metadataItems = metadataStore.getMetadataItems(sortedMetadataIds)
        const last = lastSnapshotRef.current
        const keys = Object.keys(metadataItems)
        const lastKeys = Object.keys(last.values)
        if (
            last.ids.length === sortedMetadataIds.length &&
            last.ids.every((id, i) => id === sortedMetadataIds[i]) &&
            lastKeys.length === keys.length &&
            lastKeys.every((k, i) => k === keys[i]) &&
            keys.every((k) => last.values[k] === metadataItems[k])
        ) {
            return last.values
        }
        lastSnapshotRef.current = {
            ids: sortedMetadataIds,
            values: metadataItems,
        }
        return metadataItems
        // sortedMetadataIds is intentionally spread for stable deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metadataStore, ...sortedMetadataIds])

    const result = useSyncExternalStore(
        useCallback(
            (callback) => {
                const unsubscribeFunctions = sortedMetadataIds.map(
                    (metadataId) =>
                        metadataStore.subscribe(metadataId, callback)
                )
                return () => {
                    unsubscribeFunctions.forEach((unsubscribe) => unsubscribe())
                }
            },
            // sortedMetadataIds is intentionally spread for stable deps
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [metadataStore, ...sortedMetadataIds]
        ),
        getSnapshot
    )
    return result
}

export const useAddMetadata = (): MetadataStore['addMetadata'] => {
    const metadataStore = useContext(MetadataContext)!

    const [addMetadata] = useState(() =>
        metadataStore.addMetadata.bind(metadataStore)
    )

    return addMetadata
}

export type UseMetadataStoreReturnValue = Pick<
    MetadataStore,
    | 'getMetadataItem'
    | 'getMetadataItems'
    | 'addMetadata'
    | 'setVisualizationMetadata'
>
export const useMetadataStore = (): UseMetadataStoreReturnValue => {
    const metadataStore = useContext(MetadataContext) as MetadataStore
    const [api] = useState(() => ({
        getMetadataItem: metadataStore.getMetadataItem.bind(metadataStore),
        getMetadataItems: metadataStore.getMetadataItems.bind(metadataStore),
        addMetadata: metadataStore.addMetadata.bind(metadataStore),
        setVisualizationMetadata:
            metadataStore.setVisualizationMetadata.bind(metadataStore),
    }))
    return api
}
