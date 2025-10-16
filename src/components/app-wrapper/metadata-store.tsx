import {
    type MetadataStoreItem,
    type Subscriber,
    type AnyMetadataItemInput,
    type MetadataInput,
    normalizeMetadataInputItem,
    smartMergeWithChangeDetection,
    isObject,
    isSingleMetadataItemInput,
} from './metadata-helpers'
import { extractMetadataFromVisualization } from './metadata-helpers/visualization'
import type { AppCachedData, SavedVisualization } from '@types'

declare global {
    interface Window {
        getMetadataStore: () => Record<string, MetadataStoreItem>
        getMetadataStoreItem: (key: string) => MetadataStoreItem | undefined
    }
}

export type InitialMetadataItems = Record<string, AnyMetadataItemInput>

export class MetadataStore {
    private metadata = new Map<string, MetadataStoreItem>()
    private subscribers = new Map<string, Set<Subscriber>>()
    private initialMetadataKeys = new Set<string>()
    private initialMetadataItems: InitialMetadataItems
    private rootOrgUnits?: AppCachedData['rootOrgUnits']

    constructor(
        initialMetadataItems: Record<string, AnyMetadataItemInput>,
        /** When rendered by the app the rootOrgUnits is provided
         *  but when rendered by the plugin it is not */
        rootOrgUnits?: AppCachedData['rootOrgUnits']
    ) {
        this.initialMetadataItems = initialMetadataItems
        this.rootOrgUnits = rootOrgUnits

        this.addInitialMetadataItems()

        if (process.env.NODE_ENV === 'development') {
            window.getMetadataStore = () => Object.fromEntries(this.metadata)
            window.getMetadataStoreItem = (key: string) =>
                this.getMetadataItem(key)
        }
    }

    setVisualizationMetadata(visualization: SavedVisualization) {
        this.metadata.clear()
        /* This will not trigger a rerender, which is OK because the initial items
         * are always identical */
        this.addInitialMetadataItems()
        const visualizationMetadata =
            extractMetadataFromVisualization(visualization)
        /* TODO: There are some shortcoming to this approach, but I think these are
         * purely theoretical, because this actually happens while the visualization is
         * still loading. I'll note some possible issues anyway:
         * - It will cause a rerender to all NEW metadata items, eben if they are the
         *   same as before
         * - If anything is rendered and subscribed to a deleted metadata item, the
         *   component will not be rerendered */
        this.addMetadata(visualizationMetadata)
    }

    getMetadataItem(key: string): MetadataStoreItem | undefined {
        return this.metadata.get(key)
    }

    getMetadataItems(keys: string[]): Record<string, MetadataStoreItem> {
        return keys.reduce((metadataStoreItems, key) => {
            const item = this.metadata.get(key)
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

            const existingMetadataStoreItem = this.metadata.get(itemId)
            const { hasChanges, mergedItem } = smartMergeWithChangeDetection(
                existingMetadataStoreItem,
                newMetadataStoreItem
            )
            if (hasChanges) {
                this.metadata.set(itemId, mergedItem)
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

    private addInitialMetadataItems() {
        Object.entries(this.initialMetadataItems).forEach(([key, item]) => {
            this.metadata.set(key, normalizeMetadataInputItem(item))
            this.initialMetadataKeys.add(key)
        })

        if (!this.rootOrgUnits) {
            return
        }
        for (const rootOrgUnit of this.rootOrgUnits) {
            if (rootOrgUnit.id) {
                this.metadata.set(
                    rootOrgUnit.id,
                    normalizeMetadataInputItem({
                        ...rootOrgUnit,
                        path: `/${rootOrgUnit.id}`,
                    })
                )
            }
        }
    }
}
