import { extractMetadataFromAnalyticsResponse } from './analytics-data'
import { parseDimensionIdInput } from './dimension'
import { smartMergeWithChangeDetection } from './merge-utils'
import { normalizeMetadataInputItem } from './normalization'
import { extractMetadataFromVisualization } from './visualization'
import type { LineListAnalyticsDataHeader } from '@components/line-list/types'
import type { AnalyticsResponseMetadataDimensions } from '@components/plugin-wrapper/hooks/use-line-list-analytics-data'
import {
    isMetadataInputItem,
    isDimensionMetadataItem,
    isProgramMetadataItem,
    isProgramStageMetadataItem,
} from '@modules/metadata'
import { isObject } from '@modules/validation'
import type {
    MetadataInputItem,
    MetadataItem,
    Subscriber,
    MetadataInput,
    InitialMetadataItems,
    AnalyticsResponseMetadataItems,
    AppCachedData,
    SavedVisualization,
    DimensionMetadata,
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

const isItemMatch = (item: MetadataItem, token: string) =>
    item.id.includes(token) ||
    item.name?.toLowerCase().includes(token.toLowerCase())

export class MetadataStore {
    private metadata = new Map<string, MetadataItem>()
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
        dimensions: AnalyticsResponseMetadataDimensions,
        headers: Array<LineListAnalyticsDataHeader>
    ) {
        this.addMetadata(
            extractMetadataFromAnalyticsResponse(items, dimensions, headers)
        )
    }

    getMetadataItem(key: string): MetadataItem | undefined {
        return this.metadata.get(key)
    }

    getMetadataItems(keys: string[]): Record<string, MetadataItem> {
        return keys.reduce((metadataStoreItems, key) => {
            const item = this.metadata.get(key)
            if (item) {
                metadataStoreItems[key] = item
            }
            return metadataStoreItems
        }, {})
    }

    getDimensionMetadata(input: string): DimensionMetadata {
        const { ids, repetitionIndex } = parseDimensionIdInput(input)
        const nestedDimensionId = ids.join('.')
        const result: DimensionMetadata = {
            dimensionId: '',
            programStageId: undefined,
            programId: undefined,
            repetitionIndex,
            dimension: undefined,
            program: undefined,
            programStage: undefined,
        }

        // ids.length > 0 && <= 3 guaranteed by parseDimensionIdInput
        if (ids.length === 1) {
            result.dimensionId = ids[0]
        } else if (ids.length === 2) {
            /* First ID could be either a program or a stage.
             * Query the metadata store to find out which one it is or just leave undefined */
            const [unknownId, dimensionId] = ids
            const unknownMetadata = this.metadata.get(unknownId)

            result.dimensionId = dimensionId
            if (unknownMetadata) {
                if (isProgramMetadataItem(unknownMetadata)) {
                    result.programId = unknownId
                } else if (isProgramStageMetadataItem(unknownMetadata)) {
                    result.programStageId = unknownId
                } else {
                    throw new Error(
                        `"${unknownId}" is not a program or program stage metadata item`
                    )
                }
            }
        } else if (ids.length === 3) {
            const [programId, programStageId, dimensionId] = ids
            result.programId = programId
            result.programStageId = programStageId
            result.dimensionId = dimensionId
        }

        const dimension =
            this.metadata.get(nestedDimensionId) ??
            this.metadata.get(result.dimensionId)
        const program = result.programId && this.metadata.get(result.programId)
        const programStage =
            result.programStageId && this.metadata.get(result.programStageId)

        if (dimension) {
            if (isDimensionMetadataItem(dimension)) {
                result.dimension = dimension
            } else {
                throw new Error(
                    `"${result.dimensionId}" is not a valid dimension metadata item`
                )
            }
        }

        if (program) {
            if (isProgramMetadataItem(program)) {
                result.program = program
            } else {
                throw new Error(
                    `"${result.programId}" is not a valid program metadata item`
                )
            }
        }

        if (programStage) {
            if (isProgramStageMetadataItem(programStage)) {
                result.programStage = programStage
            } else {
                throw new Error(
                    `"${result.programStageId}" is not a valid programStage metadata item`
                )
            }
        }

        return result
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
            metadataInputItem: MetadataInputItem | string,
            key?: string
        ) => {
            const newMetadataStoreItem = normalizeMetadataInputItem(
                metadataInputItem,
                this.metadata,
                key
            )
            const itemId = newMetadataStoreItem.id
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
