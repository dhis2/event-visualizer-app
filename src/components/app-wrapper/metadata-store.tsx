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

    constructor(
        initialMetadataItems: InitialMetadataItems,
        /** When rendered by the app the rootOrgUnits is provided
         *  but when rendered by the plugin it is not */
        rootOrgUnits?: AppCachedData['rootOrgUnits']
    ) {
        this.addInitialMetadataItems(initialMetadataItems, rootOrgUnits)

        if (process.env.NODE_ENV === 'development') {
            window.getMetadataStore = () => Object.fromEntries(this.metadata)
            window.getMetadataStoreItem = (key: string) =>
                this.getMetadataItem(key)
        }
    }

    setVisualizationMetadata(visualization: SavedVisualization) {
        const visualizationMetadata =
            extractMetadataFromVisualization(visualization)
        /* The code below is designed to keep metadata hook rerenders to a minimum:
         * The initial metadata does not need to be updated because it remains unchanged.
         * The metadata items for the new visualization are updated as needed by calling `addMetadata`
         * The removed metadata items could have subscriptions remaining, so these are notified */
        const newMetadataKeys = new Set(
            ...Object.keys(visualizationMetadata),
            ...Array.from(this.initialMetadataKeys)
        )
        const metadataKeysToRemove = this.metadata
            .keys()
            .filter((key) => !newMetadataKeys.has(key))

        for (const key of metadataKeysToRemove) {
            this.metadata.delete(key)
            this.notifySubscriber(key)
        }
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

        this.notifySubscribers(updatedMetadataIds)
    }

    private notifySubscribers(keys: Set<string>) {
        for (const key of keys) {
            this.notifySubscriber(key)
        }
    }

    private notifySubscriber(key: string) {
        if (this.subscribers.has(key)) {
            this.subscribers.get(key)!.forEach((callback) => callback())
        }
    }

    private addInitialMetadataItems(
        initialMetadataItems: InitialMetadataItems,
        rootOrgUnits?: AppCachedData['rootOrgUnits']
    ) {
        Object.entries(initialMetadataItems).forEach(([key, item]) => {
            this.metadata.set(key, normalizeMetadataInputItem(item))
            this.initialMetadataKeys.add(key)
        })

        if (rootOrgUnits) {
            for (const rootOrgUnit of rootOrgUnits) {
                if (rootOrgUnit.id) {
                    this.metadata.set(
                        rootOrgUnit.id,
                        normalizeMetadataInputItem({
                            ...rootOrgUnit,
                            path: `/${rootOrgUnit.id}`,
                        })
                    )
                    this.initialMetadataKeys.add(rootOrgUnit.id)
                }
            }
        }
    }
}
