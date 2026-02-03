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
import { parseDimensionIdInput } from './dimension'
import { getInitialMetadata } from './initial-metadata'
import { MetadataStore } from './metadata-store'
import { useRootOrgUnits } from '@hooks'
import {
    isProgramMetadataItem,
    isProgramStageMetadataItem,
    isOptionSetMetadataItem,
    isLegendSetMetadataItem,
    isOrganisationUnitMetadataItem,
    isUserOrgUnitMetadataItem,
    isDimensionMetadataItem,
} from '@modules/metadata'
import { isPopulatedString } from '@modules/validation'
import type {
    InitialMetadataItems,
    MetadataItem,
    DimensionMetadata,
    ProgramMetadataItem,
    ProgramStageMetadataItem,
    OptionSetMetadataItem,
    LegendSetMetadataItem,
    OrganisationUnitMetadataItem,
    UserOrgUnitMetadataItem,
    DimensionMetadataItem,
} from '@types'

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
    metadataId: string | null | undefined
): MetadataItem | undefined => {
    const metadataStore = useContext(MetadataContext)!
    const result = useSyncExternalStore(
        useCallback(
            (callback) => metadataStore.subscribe(metadataId, callback),
            [metadataStore, metadataId]
        ),
        () =>
            isPopulatedString(metadataId)
                ? metadataStore.getMetadataItem(metadataId)
                : undefined
    )
    return result
}
export const useProgramMetadataItem = (
    metadataId: string
): ProgramMetadataItem | undefined => {
    const item = useMetadataItem(metadataId)
    if (item && !isProgramMetadataItem(item)) {
        throw new Error('Item is not a program')
    }
    return item
}
export const useProgramStageMetadataItem = (
    metadataId: string
): ProgramStageMetadataItem | undefined => {
    const item = useMetadataItem(metadataId)
    if (item && !isProgramStageMetadataItem(item)) {
        throw new Error('Item is not a program stage')
    }
    return item
}
export const useOptionSetMetadataItem = (
    metadataId: string
): OptionSetMetadataItem | undefined => {
    const item = useMetadataItem(metadataId)
    if (item && !isOptionSetMetadataItem(item)) {
        throw new Error('Item is not an option set')
    }
    return item
}
export const useLegendSetMetadataItem = (
    metadataId: string
): LegendSetMetadataItem | undefined => {
    const item = useMetadataItem(metadataId)
    if (item && !isLegendSetMetadataItem(item)) {
        throw new Error('Item is not a legend set')
    }
    return item
}
export const useOrganisationUnitMetadataItem = (
    metadataId: string
): OrganisationUnitMetadataItem | undefined => {
    const item = useMetadataItem(metadataId)
    if (item && !isOrganisationUnitMetadataItem(item)) {
        throw new Error('Item is not an organisation unit')
    }
    return item
}
export const useUserOrgUnitMetadataItem = (
    metadataId: string
): UserOrgUnitMetadataItem | undefined => {
    const item = useMetadataItem(metadataId)
    if (item && !isUserOrgUnitMetadataItem(item)) {
        throw new Error('Item is not a user org unit')
    }
    return item
}
export const useDimensionMetadataItem = (
    metadataId: string
): DimensionMetadataItem | undefined => {
    const item = useMetadataItem(metadataId)
    if (item && !isDimensionMetadataItem(item)) {
        throw new Error('Item is not a dimension')
    }
    return item
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

export const useDimensionMetadata = (
    dimensionIdInput: string
): DimensionMetadata => {
    const metadataStore = useContext(MetadataContext)!
    const cacheRef = useRef<DimensionMetadata | null>(null)

    return useSyncExternalStore(
        useCallback(
            (callback) => {
                const { ids } = parseDimensionIdInput(dimensionIdInput)
                const unsubscribeFunctions = ids.map((id) =>
                    metadataStore.subscribe(id, callback)
                )

                return () => {
                    unsubscribeFunctions.forEach((unsubscribe) => unsubscribe())
                }
            },
            [metadataStore, dimensionIdInput]
        ),
        useCallback(() => {
            const currentData = cacheRef.current
            const freshData =
                metadataStore.getDimensionMetadata(dimensionIdInput)
            if (
                currentData &&
                Object.keys(currentData).every(
                    (key) => currentData[key] === freshData[key]
                )
            ) {
                return currentData
            } else {
                cacheRef.current = freshData
                return freshData
            }
        }, [metadataStore, dimensionIdInput])
    )
}

export const useDimensionsMetadata = (
    dimensionIdInputs: string[]
): Record<string, DimensionMetadata> => {
    const metadataStore = useContext(MetadataContext)!
    const cacheRef = useRef<Record<string, DimensionMetadata> | null>(null)

    return useSyncExternalStore(
        useCallback(
            (callback) => {
                const allIds = dimensionIdInputs.flatMap((input) => {
                    const { ids } = parseDimensionIdInput(input)
                    return ids
                })
                const uniqueIds = Array.from(new Set(allIds))
                const unsubscribeFunctions = uniqueIds.map((id) =>
                    metadataStore.subscribe(id, callback)
                )

                return () => {
                    unsubscribeFunctions.forEach((unsubscribe) => unsubscribe())
                }
            },
            [metadataStore, dimensionIdInputs]
        ),
        useCallback(() => {
            const currentData = cacheRef.current
            const freshData: Record<string, DimensionMetadata> = {}

            for (const input of dimensionIdInputs) {
                freshData[input] = metadataStore.getDimensionMetadata(input)
            }

            // Two-layer caching: check if all records have the same fields
            if (currentData) {
                const allInputsSame = dimensionIdInputs.every((input) => {
                    const currentItem = currentData[input]
                    const freshItem = freshData[input]
                    return (
                        currentItem &&
                        Object.keys(currentItem).every(
                            (key) => currentItem[key] === freshItem[key]
                        )
                    )
                })

                if (allInputsSame) {
                    return currentData
                }
            }

            cacheRef.current = freshData
            return freshData
        }, [metadataStore, dimensionIdInputs])
    )
}

export type UseMetadataStoreReturnValue = Pick<
    MetadataStore,
    | 'getMetadataItem'
    | 'getMetadataItems'
    | 'addMetadata'
    | 'setVisualizationMetadata'
    | 'getDimensionMetadata'
>
export const useMetadataStore = (): UseMetadataStoreReturnValue => {
    const metadataStore = useContext(MetadataContext) as MetadataStore
    const [api] = useState(() => ({
        getMetadataItem: metadataStore.getMetadataItem.bind(metadataStore),
        getMetadataItems: metadataStore.getMetadataItems.bind(metadataStore),
        addMetadata: metadataStore.addMetadata.bind(metadataStore),
        setVisualizationMetadata:
            metadataStore.setVisualizationMetadata.bind(metadataStore),
        getDimensionMetadata:
            metadataStore.getDimensionMetadata.bind(metadataStore),
    }))
    return api
}
