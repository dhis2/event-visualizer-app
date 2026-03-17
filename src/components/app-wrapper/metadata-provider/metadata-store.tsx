import { extractMetadataFromAnalyticsResponse } from './analytics-data'
import {
    getCompoundDimensionIdVariants,
    isCompoundDimensionId,
} from './dimension'
import { smartMergeWithChangeDetection } from './merge-utils'
import { normalizeMetadataInputItem } from './normalization'
import { extractMetadataFromVisualization } from './visualization'
import type { LineListAnalyticsDataHeader } from '@components/line-list/types'
import { isMetadataInputItem } from '@modules/metadata'
import { isObject, isPopulatedString } from '@modules/validation'
import type {
    MetadataInputItem,
    MetadataItem,
    Subscriber,
    MetadataInput,
    InitialMetadataItems,
    AnalyticsResponseMetadataItems,
    AppCachedData,
    SavedVisualization,
    MetadataMap,
} from '@types'

declare global {
    interface Window {
        getMetadataStore: () => Record<string, MetadataItem>
        getMetadataStoreItem: (key: string) => MetadataItem | undefined
        getMetadataStoreItems: (
            keys: string[]
        ) => ReturnType<MetadataStore['getMetadataItems']>
        findMetadataStoreItem: (token: string) => MetadataItem | undefined
        filterMetadataStoreItems: (token: string) => MetadataItem[]
    }
}

const noop = () => {}

const isItemMatch = (item: MetadataItem, token: string) =>
    item.id.includes(token) ||
    item.name?.toLowerCase().includes(token.toLowerCase())

export class MetadataStore {
    private metadata: MetadataMap = new Map()
    private subscribers = new Map<string, Set<Subscriber>>()
    private initialMetadataKeys = new Set<string>()

    constructor(
        initialMetadataItems: InitialMetadataItems,
        /** When rendered by the app the rootOrgUnits is provided
         *  but when rendered by the plugin it is not */
        rootOrgUnits?: AppCachedData['rootOrgUnits']
    ) {
        this.addInitialMetadataItems(initialMetadataItems, rootOrgUnits)

        if (
            process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'test'
        ) {
            window.getMetadataStore = () => Object.fromEntries(this.metadata)
            window.getMetadataStoreItem = (key: string) =>
                this.getMetadataItem(key)
            window.getMetadataStoreItems = (keys: string[]) =>
                this.getMetadataItems(keys)
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

    protected get metadataMap(): Map<string, MetadataItem> {
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
        items: AnalyticsResponseMetadataItems,
        headers: Array<LineListAnalyticsDataHeader>
    ) {
        this.addMetadata(extractMetadataFromAnalyticsResponse(items, headers))
    }

    getMetadataItem(key: string): MetadataItem | undefined {
        const item = this.metadata.get(key)

        if (item) {
            return item
        }

        if (!isCompoundDimensionId(key)) {
            return undefined
        }

        const possibleKeys = this.getSafeCompoundDimensionIdVariants(key)

        for (const possibleKey of possibleKeys) {
            const potentialItem = this.metadata.get(possibleKey)
            if (potentialItem) {
                return potentialItem
            }
        }

        return undefined
    }

    getMetadataItems(keys: string[]): Record<string, MetadataItem> {
        return keys.reduce((metadataStoreItems, key) => {
            const item = this.getMetadataItem(key)
            if (item) {
                metadataStoreItems[key] = item
            }
            return metadataStoreItems
        }, {})
    }

    subscribe(key: string | null | undefined, cb: Subscriber) {
        if (!isPopulatedString(key)) {
            return noop
        }
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
        // Track keys of items that were actually updated
        const updatedMetadataKeys = new Set<string>()
        /* Compound dimension keys need context metadata to be processed correctly,
         * so process plain keys first (programs, stages, trackedEntityTypes),
         * then process deferred compound keys. */
        const deferredCompoundMetadataInputs = new Map<
            string,
            MetadataInputItem | string
        >()

        const processMetadataItem = (
            metadataInputItem: MetadataInputItem | string,
            key?: string,
            includeCompoundDimensionIds: boolean = false
        ) => {
            const inputKey =
                key ??
                (isObject(metadataInputItem) && 'id' in metadataInputItem
                    ? metadataInputItem.id
                    : undefined)

            if (
                !includeCompoundDimensionIds &&
                isCompoundDimensionId(inputKey)
            ) {
                deferredCompoundMetadataInputs.set(inputKey, metadataInputItem)
                return
            }

            const { key: normalizedStoreKey, item } =
                normalizeMetadataInputItem(
                    metadataInputItem,
                    this.metadata,
                    key
                )

            const existingMetadataStoreItem =
                this.metadata.get(normalizedStoreKey)

            const { hasChanges, mergedItem } = smartMergeWithChangeDetection(
                existingMetadataStoreItem,
                item
            )
            if (hasChanges) {
                this.metadata.set(normalizedStoreKey, mergedItem)
                updatedMetadataKeys.add(normalizedStoreKey)
            }
        }

        // Handle all input types: array, single object, or record
        if (Array.isArray(metadataInput)) {
            metadataInput.forEach((item) => {
                processMetadataItem(item)
            })
        } else if (isObject(metadataInput)) {
            if (isMetadataInputItem(metadataInput)) {
                processMetadataItem(metadataInput)
            } else {
                Object.entries(metadataInput).forEach(([key, value]) => {
                    processMetadataItem(value, key)
                })
            }
        }

        for (const [key, item] of deferredCompoundMetadataInputs) {
            processMetadataItem(item, key, true)
        }

        this.notifySubscribers(updatedMetadataKeys)
    }

    private notifySubscribers(keys: Set<string>) {
        const keysToNotify = new Set<string>()

        for (const key of keys) {
            keysToNotify.add(key)

            if (isCompoundDimensionId(key)) {
                const variants = this.getSafeCompoundDimensionIdVariants(key)
                variants.forEach((variantKey) => {
                    if (this.subscribers.has(variantKey)) {
                        keysToNotify.add(variantKey)
                    }
                })
            }
        }

        for (const key of keysToNotify) {
            this.notifySubscriber(key)
        }
    }

    private notifySubscriber(key: string) {
        if (this.subscribers.has(key)) {
            this.subscribers.get(key)!.forEach((callback) => callback())
        }
    }

    private getSafeCompoundDimensionIdVariants(compoundKey: string): string[] {
        try {
            return getCompoundDimensionIdVariants(compoundKey, this.metadata)
        } catch {
            return []
        }
    }

    private addInitialMetadataItems(
        initialMetadataItems: InitialMetadataItems,
        rootOrgUnits?: AppCachedData['rootOrgUnits']
    ) {
        const initialMetadataWithRootOrgUnits = rootOrgUnits
            ? rootOrgUnits.reduce((acc, rootOrgUnit) => {
                  acc[rootOrgUnit.id] = {
                      ...rootOrgUnit,
                      path: `/${rootOrgUnit.id}`,
                  }
                  return acc
              }, initialMetadataItems)
            : initialMetadataItems

        Object.keys(initialMetadataWithRootOrgUnits).forEach((key) => {
            this.initialMetadataKeys.add(key)
        })

        this.addMetadata(initialMetadataWithRootOrgUnits as MetadataInput)
    }
}
