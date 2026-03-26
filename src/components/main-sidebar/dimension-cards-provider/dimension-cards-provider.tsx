import { useMemo, type FC, type ReactNode } from 'react'
import { createDynamicCardAssigner } from './create-dynamic-card-assigner'
import { DimensionCardsContext } from './dimension-cards-context'
import { useAppSelector, useMetadataStore } from '@hooks'
import { getVisUiConfigLayoutAllDimensionIds } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem, MetadataItem } from '@types'

type DimensionCardsProviderProps = {
    children: ReactNode
    dataSourceMetadataItem: MetadataItem
}

export const DimensionCardsProvider: FC<DimensionCardsProviderProps> = ({
    children,
    dataSourceMetadataItem,
}) => {
    const metadataStore = useMetadataStore()
    const selectedDimensionIds = useAppSelector(
        getVisUiConfigLayoutAllDimensionIds
    )
    const dynamicCardAssigner = useMemo(
        () => createDynamicCardAssigner(dataSourceMetadataItem),
        [dataSourceMetadataItem]
    )
    const selectionByCardLookup = useMemo(
        () =>
            selectedDimensionIds.reduce((lookup, selectedDimensionId) => {
                const dimensionMetadataItem =
                    metadataStore.getDimensionMetadataItem(selectedDimensionId)!
                for (const [
                    cardKey,
                    matcherFnOrMatcherRecord,
                ] of Object.entries(dynamicCardAssigner)) {
                    // Program stages card has matchers under stage
                    const isMatcherFn =
                        typeof matcherFnOrMatcherRecord === 'function'
                    // Create structure on the fly
                    if (!lookup[cardKey]) {
                        lookup[cardKey] = isMatcherFn
                            ? new Set()
                            : Object.keys(matcherFnOrMatcherRecord).reduce(
                                  (acc, key) => {
                                      acc[key] = new Set()
                                      return acc
                                  },
                                  {}
                              )
                    }
                    if (
                        isMatcherFn &&
                        matcherFnOrMatcherRecord(dimensionMetadataItem)
                    ) {
                        lookup[cardKey].add(dimensionMetadataItem.id)
                        return lookup
                    }

                    if (!isMatcherFn) {
                        for (const [id, matchFn] of Object.entries(
                            matcherFnOrMatcherRecord
                        )) {
                            if (matchFn(dimensionMetadataItem)) {
                                lookup[cardKey][id].add(
                                    dimensionMetadataItem.id
                                )
                                return lookup
                            }
                        }
                    }

                    return lookup
                }
            }, {}),
        [dynamicCardAssigner, metadataStore, selectedDimensionIds]
    )
    console.log(selectionByCardLookup)

    const selectedIds = useMemo(
        () => new Set(selectedDimensionIds),
        [selectedDimensionIds]
    )

    const selectedDimensions = useMemo(
        () =>
            Object.values(selectedDimensionsRecord) as DimensionMetadataItem[],
        [selectedDimensionsRecord]
    )

    const value = useMemo(
        () => ({ selectedIds, selectedDimensions }),
        [selectedIds, selectedDimensions]
    )

    return (
        <DimensionCardsContext.Provider value={value}>
            {children}
        </DimensionCardsContext.Provider>
    )
}
