import { extractMetadataFromAnalyticsResponse } from './analytics-data'
import { isCompoundDimensionId, resolveId } from './dimension'
import { smartMergeWithChangeDetection } from './merge-utils'
import {
    getCanonicalKeysForInput,
    normalizeMetadataInputItem,
    extractInputId,
} from './normalization'
import { assertTypedMetadataItem } from './typed-metadata-item'
import { extractMetadataFromVisualization } from './visualization'
import type { LineListAnalyticsDataHeader } from '@components/line-list/types'
import {
    isMetadataInputItem,
    isProgramMetadataItem,
    isProgramStageMetadataItem,
    isOptionSetMetadataItem,
    isLegendSetMetadataItem,
    isOrganisationUnitMetadataItem,
    isUserOrgUnitMetadataItem,
    isDimensionMetadataItem,
} from '@modules/metadata'
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
    Program,
    ProgramStage,
    OptionSetMetadataItem,
    LegendSetMetadataItem,
    OrganisationUnitMetadataItem,
    UserOrgUnitMetadataItem,
    DimensionMetadataItem,
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
    private readonly initialMetadataIds = new Set<string>()

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

        const previousIds = new Set(this.metadata.keys())

        // Add new items before computing retained IDs, so compound IDs
        // can be canonicalized against the updated map.
        this.addMetadata(visualizationMetadata)

        const nextIds = new Set([
            ...getCanonicalKeysForInput(visualizationMetadata, this.metadata),
            ...this.initialMetadataIds,
        ])

        const idsToRemove = [...previousIds].filter((id) => !nextIds.has(id))

        for (const id of idsToRemove) {
            this.metadata.delete(id)
            this.notifySubscriber(id)
        }
    }

    addAnalyticsResponseMetadata(
        items: AnalyticsResponseMetadataItems,
        headers: Array<LineListAnalyticsDataHeader>
    ) {
        this.addMetadata(extractMetadataFromAnalyticsResponse(items, headers))
    }

    getMetadataItem(id: string): MetadataItem | undefined {
        return this.metadata.get(resolveId(id))
    }

    getMetadataItems(ids: string[]): Record<string, MetadataItem> {
        return ids.reduce((metadataStoreItems, id) => {
            const item = this.getMetadataItem(id)
            if (item) {
                metadataStoreItems[id] = item
            }
            return metadataStoreItems
        }, {})
    }

    getProgramMetadataItem(id: string): Program | undefined {
        return assertTypedMetadataItem(
            this.getMetadataItem(id),
            isProgramMetadataItem,
            'Item is not a program'
        )
    }

    getProgramStageMetadataItem(id: string): ProgramStage | undefined {
        return assertTypedMetadataItem(
            this.getMetadataItem(id),
            isProgramStageMetadataItem,
            'Item is not a program stage'
        )
    }

    getOptionSetMetadataItem(id: string): OptionSetMetadataItem | undefined {
        return assertTypedMetadataItem(
            this.getMetadataItem(id),
            isOptionSetMetadataItem,
            'Item is not an option set'
        )
    }

    getLegendSetMetadataItem(id: string): LegendSetMetadataItem | undefined {
        return assertTypedMetadataItem(
            this.getMetadataItem(id),
            isLegendSetMetadataItem,
            'Item is not a legend set'
        )
    }

    getOrganisationUnitMetadataItem(
        id: string
    ): OrganisationUnitMetadataItem | undefined {
        return assertTypedMetadataItem(
            this.getMetadataItem(id),
            isOrganisationUnitMetadataItem,
            'Item is not an organisation unit'
        )
    }

    getUserOrgUnitMetadataItem(
        id: string
    ): UserOrgUnitMetadataItem | undefined {
        return assertTypedMetadataItem(
            this.getMetadataItem(id),
            isUserOrgUnitMetadataItem,
            'Item is not a user org unit'
        )
    }

    getDimensionMetadataItem(id: string): DimensionMetadataItem | undefined {
        return assertTypedMetadataItem(
            this.getMetadataItem(id),
            isDimensionMetadataItem,
            'Item is not a dimension'
        )
    }

    subscribe(id: string | null | undefined, cb: Subscriber) {
        if (!isPopulatedString(id)) {
            return noop
        }
        // Resolve to canonical ID at subscription time.
        const canonicalId = resolveId(id)
        if (!this.subscribers.has(canonicalId)) {
            this.subscribers.set(canonicalId, new Set())
        }
        this.subscribers.get(canonicalId)!.add(cb)

        return () => {
            this.subscribers.get(canonicalId)!.delete(cb)
            if (this.subscribers.get(canonicalId)!.size === 0) {
                this.subscribers.delete(canonicalId)
            }
        }
    }

    /**
     * Adds or updates metadata items in the store, notifying subscribers only
     * for items that actually changed. Plain items (programs, stages) are
     * processed before compound-ID items so context is available for
     * field enrichment.
     */
    addMetadata(metadataInput: MetadataInput) {
        const updatedIds = new Set<string>()
        const deferredCompoundMetadataInputs = new Map<
            string,
            MetadataInputItem | string
        >()

        const processMetadataItem = (
            metadataInputItem: MetadataInputItem | string,
            key?: string,
            { deferred = false }: { deferred?: boolean } = {}
        ) => {
            const inputId = extractInputId(metadataInputItem, key)

            if (!deferred && isCompoundDimensionId(inputId)) {
                deferredCompoundMetadataInputs.set(inputId, metadataInputItem)
                return
            }

            const normalizedStoreItem = normalizeMetadataInputItem(
                metadataInputItem,
                this.metadata,
                key
            )

            const normalizedId = normalizedStoreItem.id

            const existingMetadataStoreItem = this.metadata.get(normalizedId)

            const { hasChanges, mergedItem } = smartMergeWithChangeDetection(
                existingMetadataStoreItem,
                normalizedStoreItem
            )
            if (hasChanges) {
                this.metadata.set(normalizedId, mergedItem)
                updatedIds.add(normalizedId)
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
                Object.entries(metadataInput).forEach(([id, value]) => {
                    processMetadataItem(value, id)
                })
            }
        }

        for (const [id, item] of deferredCompoundMetadataInputs) {
            processMetadataItem(item, id, { deferred: true })
        }

        this.notifySubscribers(updatedIds)
    }

    private notifySubscribers(ids: Set<string>) {
        for (const id of ids) {
            this.notifySubscriber(id)
        }
    }

    private notifySubscriber(id: string) {
        if (this.subscribers.has(id)) {
            this.subscribers.get(id)!.forEach((callback) => callback())
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

        Object.keys(initialMetadataWithRootOrgUnits).forEach((id) => {
            this.initialMetadataIds.add(id)
        })

        this.addMetadata(initialMetadataWithRootOrgUnits as MetadataInput)
    }
}
