import {
    type MetadataStoreItem,
    type Subscriber,
    type AnyMetadataItemInput,
    type MetadataInput,
    type AnalyticsMetadataInput,
    normalizeMetadataInputItem,
    smartMergeWithChangeDetection,
    isObject,
    isSingleMetadataItemInput,
} from './metadata-helpers'
import { extractMetadataFromAnalyticsResponse } from './metadata-helpers/analytics-data'
import { isUserOrgUnitMetadataItem } from './metadata-helpers/type-guards'
import { extractMetadataFromVisualization } from './metadata-helpers/visualization'
import type { AnalyticsResponseMetadataDimensions } from '@components/plugin-wrapper/hooks/use-line-list-analytics-data'
import type { AppCachedData, SavedVisualization } from '@types'

declare global {
    interface Window {
        getMetadataStore: () => Record<string, MetadataStoreItem>
        getMetadataStoreItem: (key: string) => MetadataStoreItem | undefined
        findMetadataStoreItem: (token: string) => MetadataStoreItem | undefined
        filterMetadataStoreItems: (token: string) => MetadataStoreItem[]
    }
}

export type InitialMetadataItems = Record<string, AnyMetadataItemInput>

const isItemMatch = (item: MetadataStoreItem, token: string) =>
    item.id.includes(token) || item.name?.toLowerCase().includes(token)

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
            window.findMetadataStoreItem = (token: string) =>
                Array.from(this.metadata.values()).find((item) =>
                    isItemMatch(item, token)
                )
            window.filterMetadataStoreItems = (token: string) =>
                Array.from(this.metadata.values()).filter((item) =>
                    isItemMatch(item, token)
                )
        }
    }

    protected get metadataMap(): Map<string, MetadataStoreItem> {
        return this.metadata
    }

    setVisualizationMetadata(visualization: SavedVisualization) {
        const visualizationMetadata =
            extractMetadataFromVisualization(visualization)
        /* The code below is designed to keep metadata hook rerenders to a minimum:
         * The initial metadata does not need to be updated because it remains unchanged.
         * The metadata items for the new visualization are updated as needed by calling `addMetadata`
         * The removed metadata items could have subscriptions remaining, so these are notified */
        const newMetadataKeys = new Set([
            ...Object.keys(visualizationMetadata),
            ...Array.from(this.initialMetadataKeys),
        ])
        const metadataKeysToRemove = Array.from(this.metadata.keys()).filter(
            (key) => !newMetadataKeys.has(key)
        )

        for (const key of metadataKeysToRemove) {
            this.metadata.delete(key)
            this.notifySubscriber(key)
        }
        this.addMetadata(visualizationMetadata)
    }

    addAnalyticsResponseMetadata(
        items: AnalyticsMetadataInput,
        dimensions: AnalyticsResponseMetadataDimensions
    ) {
        this.addMetadata(
            extractMetadataFromAnalyticsResponse(items, dimensions)
        )
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

        const processMetadataItem = (
            metadataInputItem: AnyMetadataItemInput
        ) => {
            const newMetadataStoreItem = normalizeMetadataInputItem(
                metadataInputItem,
                this.metadata
            )
            const itemId = newMetadataStoreItem.id

            if (this.isReadOnlyMetadata(newMetadataStoreItem)) {
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

    private isReadOnlyMetadata(item: MetadataStoreItem) {
        return (
            /* Initial metadata is read only, except for USER_ORGUNIT
             * which receives am `organisationUnits` array from the
             * analytics data */
            this.initialMetadataKeys.has(item.id) &&
            !isUserOrgUnitMetadataItem(item)
        )
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
            const normalizedItem = normalizeMetadataInputItem(
                item,
                this.metadata
            )
            this.metadata.set(key, normalizedItem)
            this.initialMetadataKeys.add(key)
        })

        if (rootOrgUnits) {
            for (const rootOrgUnit of rootOrgUnits) {
                if (rootOrgUnit.id) {
                    const normalizedItem = normalizeMetadataInputItem(
                        {
                            ...rootOrgUnit,
                            path: `/${rootOrgUnit.id}`,
                        },
                        this.metadata
                    )
                    this.metadata.set(rootOrgUnit.id, normalizedItem)
                    this.initialMetadataKeys.add(rootOrgUnit.id)
                }
            }
        }
    }
}
