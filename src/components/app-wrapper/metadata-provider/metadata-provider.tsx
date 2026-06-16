import { useRootOrgUnits } from '@components/app-wrapper/app-cached-data-query-provider'
import {
    isProgramMetadataItem,
    isProgramStageMetadataItem,
    isOptionSetMetadataItem,
    isLegendSetMetadataItem,
    isOrganisationUnitMetadataItem,
    isUserOrgUnitMetadataItem,
    isDimensionMetadataItem,
} from '@modules/metadata'
import { getInitialMetadata } from '@modules/metadata-store/initial-metadata'
import { MetadataStore } from '@modules/metadata-store/metadata-store'
import { assertTypedMetadataItem } from '@modules/metadata-store/typed-metadata-item'
import { isPopulatedString } from '@modules/validation'
import type {
    InitialMetadataItems,
    MetadataItem,
    Program,
    ProgramStage,
    OptionSetMetadataItem,
    LegendSetMetadataItem,
    OrganisationUnitMetadataItem,
    UserOrgUnitMetadataItem,
    DimensionMetadataItem,
} from '@types'
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

const MetadataContext = createContext<MetadataStore | null>(null)

/* App-side provider: pulls rootOrgUnits from AppCachedDataQueryProvider. */
export const AppMetadataProvider: FC<{ children: ReactNode }> = ({
    children,
}) => {
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

/* Plugin-side provider: no rootOrgUnits dependency, so the plugin can render
 * without an AppCachedDataQueryProvider ancestor. */
export const PluginMetadataProvider: FC<{ children: ReactNode }> = ({
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

/* Test-side provider: seeds the store with mock metadata. Pulls rootOrgUnits
 * from AppCachedDataQueryProvider, which the test-utils wrapper sets up. */
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
    metadataId: string | null | undefined
): Program | undefined =>
    assertTypedMetadataItem(
        useMetadataItem(metadataId),
        isProgramMetadataItem,
        'Item is not a program'
    )

export const useProgramStageMetadataItem = (
    metadataId: string | null | undefined
): ProgramStage | undefined =>
    assertTypedMetadataItem(
        useMetadataItem(metadataId),
        isProgramStageMetadataItem,
        'Item is not a program stage'
    )

export const useOptionSetMetadataItem = (
    metadataId: string | null | undefined
): OptionSetMetadataItem | undefined =>
    assertTypedMetadataItem(
        useMetadataItem(metadataId),
        isOptionSetMetadataItem,
        'Item is not an option set'
    )

export const useLegendSetMetadataItem = (
    metadataId: string | null | undefined
): LegendSetMetadataItem | undefined =>
    assertTypedMetadataItem(
        useMetadataItem(metadataId),
        isLegendSetMetadataItem,
        'Item is not a legend set'
    )

export const useOrganisationUnitMetadataItem = (
    metadataId: string | null | undefined
): OrganisationUnitMetadataItem | undefined =>
    assertTypedMetadataItem(
        useMetadataItem(metadataId),
        isOrganisationUnitMetadataItem,
        'Item is not an organisation unit'
    )

export const useUserOrgUnitMetadataItem = (
    metadataId: string | null | undefined
): UserOrgUnitMetadataItem | undefined =>
    assertTypedMetadataItem(
        useMetadataItem(metadataId),
        isUserOrgUnitMetadataItem,
        'Item is not a user org unit'
    )

export const useDimensionMetadataItem = (
    metadataId: string | null | undefined
): DimensionMetadataItem | undefined =>
    assertTypedMetadataItem(
        useMetadataItem(metadataId),
        isDimensionMetadataItem,
        'Item is not a dimension'
    )
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
export type UseMetadataStoreReturnValue = Pick<
    MetadataStore,
    | 'getMetadataItem'
    | 'getMetadataItems'
    | 'getProgramMetadataItem'
    | 'getProgramStageMetadataItem'
    | 'getOptionSetMetadataItem'
    | 'getLegendSetMetadataItem'
    | 'getOrganisationUnitMetadataItem'
    | 'getUserOrgUnitMetadataItem'
    | 'getDimensionMetadataItem'
    | 'addMetadata'
    | 'setVisualizationMetadata'
>
export const useMetadataStore = (): UseMetadataStoreReturnValue => {
    const metadataStore = useContext(MetadataContext) as MetadataStore
    const [api] = useState(() => ({
        getMetadataItem: metadataStore.getMetadataItem.bind(metadataStore),
        getMetadataItems: metadataStore.getMetadataItems.bind(metadataStore),
        getProgramMetadataItem:
            metadataStore.getProgramMetadataItem.bind(metadataStore),
        getProgramStageMetadataItem:
            metadataStore.getProgramStageMetadataItem.bind(metadataStore),
        getOptionSetMetadataItem:
            metadataStore.getOptionSetMetadataItem.bind(metadataStore),
        getLegendSetMetadataItem:
            metadataStore.getLegendSetMetadataItem.bind(metadataStore),
        getOrganisationUnitMetadataItem:
            metadataStore.getOrganisationUnitMetadataItem.bind(metadataStore),
        getUserOrgUnitMetadataItem:
            metadataStore.getUserOrgUnitMetadataItem.bind(metadataStore),
        getDimensionMetadataItem:
            metadataStore.getDimensionMetadataItem.bind(metadataStore),
        addMetadata: metadataStore.addMetadata.bind(metadataStore),
        setVisualizationMetadata:
            metadataStore.setVisualizationMetadata.bind(metadataStore),
    }))
    return api
}
