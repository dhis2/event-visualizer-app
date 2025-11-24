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
import { getInitialMetadata } from './metadata-helpers/initial-metadata'
import type {
    InitialMetadataItems,
    MetadataItem,
} from './metadata-helpers/types'
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
    mockMetadata?: InitialMetadataItems
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
): MetadataItem | undefined => {
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
const sentinel = '|'
export const useMetadataItems = (
    metadataIds: string[]
): Record<string, MetadataItem> => {
    const metadataStore = useContext(MetadataContext)!
    // Derive a stable key based on contents while preserving order invariance
    const metadataIdsKey = useMemo<string>(
        () => [...metadataIds].sort().join(sentinel),
        [metadataIds]
    )

    const sortedMetadataIds = useMemo<string[]>(
        () => (metadataIdsKey ? metadataIdsKey.split(sentinel) : []),
        [metadataIdsKey]
    )

    // Cache the last snapshot to ensure stable reference
    const lastSnapshotRef = useRef<{
        ids: string[]
        values: Record<string, MetadataItem>
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
    }, [metadataStore, sortedMetadataIds])

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
            [metadataStore, sortedMetadataIds]
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
export const useAddAnalyticsResponseMetadata =
    (): MetadataStore['addAnalyticsResponseMetadata'] => {
        const metadataStore = useContext(MetadataContext)!

        const [addAnalyticsResponseMetadata] = useState(() =>
            metadataStore.addAnalyticsResponseMetadata.bind(metadataStore)
        )

        return addAnalyticsResponseMetadata
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
