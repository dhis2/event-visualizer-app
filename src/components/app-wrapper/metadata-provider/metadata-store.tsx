import { extractMetadataFromAnalyticsResponse } from './analytics-data'
import { isCompoundDimensionId, resolveKey } from './dimension'
import { smartMergeWithChangeDetection } from './merge-utils'
import {
    getCanonicalKeysForInput,
    normalizeMetadataInputItem,
    extractInputKey,
} from './normalization'
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
    private readonly metadata: MetadataMap = new Map()
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

        const previousKeys = new Set(this.metadata.keys())

        // Add new items before computing retained keys, so compound IDs
        // can be canonicalized against the updated map.
        this.addMetadata(visualizationMetadata)

        const nextKeys = new Set([
            ...getCanonicalKeysForInput(visualizationMetadata, this.metadata),
            ...this.initialMetadataKeys,
        ])

        const keysToRemove = [...previousKeys].filter((k) => !nextKeys.has(k))

        for (const key of keysToRemove) {
            this.metadata.delete(key)
            this.notifySubscriber(key)
        }
    }

    addAnalyticsResponseMetadata(
        items: AnalyticsResponseMetadataItems,
        headers: Array<LineListAnalyticsDataHeader>
    ) {
        this.addMetadata(extractMetadataFromAnalyticsResponse(items, headers))
    }

    getMetadataItem(key: string): MetadataItem | undefined {
        return this.metadata.get(resolveKey(key))
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
        // Resolve to canonical key at subscription time.
        const canonicalKey = resolveKey(key)
        if (!this.subscribers.has(canonicalKey)) {
            this.subscribers.set(canonicalKey, new Set())
        }
        this.subscribers.get(canonicalKey)!.add(cb)

        return () => {
            this.subscribers.get(canonicalKey)!.delete(cb)
            if (this.subscribers.get(canonicalKey)!.size === 0) {
                this.subscribers.delete(canonicalKey)
            }
        }
    }

    /**
     * Adds or updates metadata items in the store, notifying subscribers only
     * for items that actually changed. Plain items (programs, stages) are
     * processed before compound-key items so context is available for
     * field enrichment.
     */
    addMetadata(metadataInput: MetadataInput) {
        const updatedMetadataKeys = new Set<string>()
        const deferredCompoundMetadataInputs = new Map<
            string,
            MetadataInputItem | string
        >()

        const processMetadataItem = (
            metadataInputItem: MetadataInputItem | string,
            key?: string,
            { deferred = false }: { deferred?: boolean } = {}
        ) => {
            const inputKey = extractInputKey(metadataInputItem, key)

            if (!deferred && isCompoundDimensionId(inputKey)) {
                deferredCompoundMetadataInputs.set(inputKey, metadataInputItem)
                return
            }

            const normalizedStoreItem = normalizeMetadataInputItem(
                metadataInputItem,
                this.metadata,
                key
            )

            const normalizedStoreKey = normalizedStoreItem.id

            const existingMetadataStoreItem =
                this.metadata.get(normalizedStoreKey)

            const { hasChanges, mergedItem } = smartMergeWithChangeDetection(
                existingMetadataStoreItem,
                normalizedStoreItem
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
            processMetadataItem(item, key, { deferred: true })
        }

        this.notifySubscribers(updatedMetadataKeys)
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
