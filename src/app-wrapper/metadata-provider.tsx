import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useSyncExternalStore,
    useMemo,
} from 'react'
import type {
    MetadataInput,
    MetadataStoreItem,
    AnyMetadataItemInput,
    Subscriber,
} from './metadata-helpers'
import {
    isObject,
    isSingleMetadataItemInput,
    normalizeMetadataInputItem,
    smartMergeWithChangeDetection,
} from './metadata-helpers'
import { getInitialMetadata } from './metadata-helpers/initial-metadata'

class MetadataStore {
    private map = new Map<string, MetadataStoreItem>()
    private subscribers = new Map<string, Set<Subscriber>>()
    private initialMetadataKeys = new Set<string>()

    constructor(initialMetadataItems?: Record<string, AnyMetadataItemInput>) {
        if (initialMetadataItems) {
            // Add initial metadata items to the store first
            Object.entries(initialMetadataItems).forEach(([key, item]) => {
                this.map.set(key, normalizeMetadataInputItem(item))
                this.initialMetadataKeys.add(key)
            })
        }
    }

    getMetadataItem(key: string): MetadataStoreItem | undefined {
        return this.map.get(key)
    }

    getMetadataItems(keys: string[]): Record<string, MetadataStoreItem> {
        return keys.reduce((metadataStoreItems, key) => {
            const item = this.map.get(key)
            if (item) {
                metadataStoreItems[key] = item
            }
            return metadataStoreItems
        }, {})
    }

    subscribe(key: string, cb: Subscriber) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set())
        }
        this.subscribers.get(key)!.add(cb)
        return () => {
            this.subscribers.get(key)!.delete(cb)
            if (this.subscribers.get(key)!.size === 0) {
                this.subscribers.delete(key)
            }
        }
    }

    /**
     * Adds or updates metadata items in the store.
     * Handles validation, shallow equality, and property removal detection in a single pass.
     * Notifies subscribers only if the item actually changed.
     */
    addMetadata(metadataInput: MetadataInput) {
        // Track ids of items that were actually updated
        const updatedMetadataIds = new Set<string>()

        const processMetadataItem = (metadataInputItem: unknown) => {
            const newMetadataStoreItem = normalizeMetadataInputItem(
                metadataInputItem as AnyMetadataItemInput
            )
            const itemId = (newMetadataStoreItem as { id: string }).id

            // Skip processing if this is an initial metadata item
            if (this.initialMetadataKeys.has(itemId)) {
                return
            }

            const existingMetadataStoreItem = this.map.get(itemId)
            const { hasChanges, mergedItem } = smartMergeWithChangeDetection(
                existingMetadataStoreItem,
                newMetadataStoreItem
            )
            if (hasChanges) {
                this.map.set(itemId, mergedItem)
                updatedMetadataIds.add(itemId)
            }
        }

        // Handle all input types: array, single object, or record
        if (Array.isArray(metadataInput)) {
            metadataInput.forEach(processMetadataItem)
        } else if (isObject(metadataInput)) {
            if (isSingleMetadataItemInput(metadataInput)) {
                processMetadataItem(metadataInput)
            } else {
                Object.values(metadataInput).forEach(processMetadataItem)
            }
        }

        // Notify subscribers for all updated ids
        updatedMetadataIds.forEach((metadataId) => {
            if (this.subscribers.has(metadataId)) {
                this.subscribers
                    .get(metadataId)!
                    .forEach((callback) => callback())
            }
        })
    }
}

const MetadataContext = createContext<MetadataStore | null>(null)

export const MetadataProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [metadataStore] = useState(
        () => new MetadataStore(getInitialMetadata())
    )
    return (
        <MetadataContext.Provider value={metadataStore}>
            {children}
        </MetadataContext.Provider>
    )
}

export function useMetadataItem(
    metadataId: string
): MetadataStoreItem | undefined {
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

export function useMetadataItems(
    metadataIds: string[]
): MetadataStoreItem[] | [] {
    const metadataStore = useContext(MetadataContext)!
    // Sort keys for stable dependency array
    const sortedMetadataIds = useMemo(
        () => [...metadataIds].sort(),
        [metadataIds]
    )

    // Cache the last snapshot to ensure stable reference
    const lastSnapshotRef = React.useRef<{
        ids: string[]
        values: MetadataStoreItem[]
    }>({
        ids: [],
        values: [],
    })

    const getSnapshot = useCallback(() => {
        const metadataItems = metadataStore.getMetadataItems(sortedMetadataIds)
        const values = Object.values(metadataItems)
        const last = lastSnapshotRef.current
        if (
            last.ids.length === sortedMetadataIds.length &&
            last.ids.every((id, i) => id === sortedMetadataIds[i]) &&
            last.values.length === values.length &&
            last.values.every((v, i) => v === values[i])
        ) {
            return last.values
        }
        lastSnapshotRef.current = { ids: sortedMetadataIds, values }
        return values
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

export function useAddMetadata(): MetadataStore['addMetadata'] {
    const metadataStore = useContext(MetadataContext)!
    return metadataStore.addMetadata.bind(metadataStore)
}

export type UseMetadataStoreReturnValue = Pick<
    MetadataStore,
    'getMetadataItem' | 'getMetadataItems' | 'addMetadata'
>
export function useMetadataStore(): UseMetadataStoreReturnValue {
    const metadataStore = useContext(MetadataContext)!
    return {
        getMetadataItem: metadataStore.getMetadataItem.bind(metadataStore),
        getMetadataItems: metadataStore.getMetadataItems.bind(metadataStore),
        addMetadata: metadataStore.addMetadata.bind(metadataStore),
    }
}
