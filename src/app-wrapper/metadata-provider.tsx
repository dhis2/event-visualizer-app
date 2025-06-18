import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useSyncExternalStore,
    useMemo,
} from 'react'

type Primitive = string | number | boolean | null | undefined
export type Metadata = { id: string } & Record<string, Primitive>

type MetadataInput = Metadata | Metadata[] | Record<string, Metadata>

type Subscriber = () => void

class MetadataStore {
    private map = new Map<string, Metadata>()
    private subscribers = new Map<string, Set<Subscriber>>()

    getMetadataItem(key: string): Metadata | undefined {
        return this.map.get(key)
    }

    getMetadataItems(keys: string[]): (Metadata | undefined)[] {
        return keys.map((key) => this.map.get(key))
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

        /**
         * Validates and processes a single metadata item:
         * - Ensures it is an object with a string id
         * - Ensures all properties (except id) are primitives
         * - Checks for any property changes or removals compared to previous item
         * - Updates the map and updatedMetadataIds set if changed
         */
        const processMetadataItem = (metadataItem: unknown) => {
            // Validate structure and id
            if (
                !metadataItem ||
                typeof metadataItem !== 'object' ||
                !('id' in metadataItem) ||
                typeof (metadataItem as { id: unknown }).id !== 'string'
            ) {
                throw new Error(
                    'Invalid metadata item: must be an object with a string id'
                )
            }
            const metadataId = (metadataItem as { id: string }).id
            const previousMetadataItem = this.map.get(metadataId)
            let hasChanged = false

            // Validate properties and check for changes
            for (const [propertyName, propertyValue] of Object.entries(
                metadataItem
            )) {
                // All properties except id must be primitives
                if (
                    propertyName !== 'id' &&
                    typeof propertyValue !== 'string' &&
                    typeof propertyValue !== 'number' &&
                    typeof propertyValue !== 'boolean' &&
                    propertyValue !== null &&
                    propertyValue !== undefined
                ) {
                    throw new Error(
                        `Metadata property '${propertyName}' must be a primitive value`
                    )
                }
                // If any property value differs from previous, mark as changed
                if (
                    !previousMetadataItem ||
                    previousMetadataItem[propertyName as keyof Metadata] !==
                        propertyValue
                ) {
                    hasChanged = true
                }
            }

            // Check for removed properties: if any propertyName in previousMetadataItem is missing in new item, mark as changed
            if (previousMetadataItem) {
                for (const propertyName of Object.keys(previousMetadataItem)) {
                    if (!(propertyName in metadataItem)) {
                        hasChanged = true
                        break
                    }
                }
            }

            // If changed, update the map and track the id
            if (hasChanged) {
                this.map.set(metadataId, metadataItem as Metadata)
                updatedMetadataIds.add(metadataId)
            }
        }

        // Handle all input types: array, single object, or record
        if (Array.isArray(metadataInput)) {
            metadataInput.forEach(processMetadataItem)
        } else if (
            typeof metadataInput === 'object' &&
            metadataInput !== null
        ) {
            if (
                'id' in metadataInput &&
                typeof (metadataInput as { id: unknown }).id === 'string'
            ) {
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
    const [metadataStore] = useState(() => new MetadataStore())
    return (
        <MetadataContext.Provider value={metadataStore}>
            {children}
        </MetadataContext.Provider>
    )
}

export function useMetadataItem(metadataId: string): Metadata | undefined {
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
): (Metadata | undefined)[] {
    const metadataStore = useContext(MetadataContext)!
    // Sort keys for stable dependency array
    const sortedMetadataIds = useMemo(
        () => [...metadataIds].sort(),
        [metadataIds]
    )

    // Cache the last snapshot to ensure stable reference
    const lastSnapshotRef = React.useRef<{
        ids: string[]
        values: (Metadata | undefined)[]
    }>({
        ids: [],
        values: [],
    })

    const getSnapshot = useCallback(() => {
        const values = metadataStore.getMetadataItems(sortedMetadataIds)
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
