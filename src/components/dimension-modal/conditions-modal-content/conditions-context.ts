import type { ConditionsObject } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem, ValueType } from '@types'
import { createContext, useContext } from 'react'

export type ConditionsContextValue = {
    dimension: DimensionMetadataItem
    conditions: ConditionsObject
    conditionsList: string[]
    valueType?: ValueType
    isLegendSetCondition: boolean
    isOptionSetCondition: boolean
    isProgramIndicator: boolean
    isSupported: boolean
    setCondition: (conditionIndex: number, value: string) => void
    removeCondition: (conditionIndex: number) => void
}

export const ConditionsContext = createContext<
    ConditionsContextValue | undefined
>(undefined)

export const useConditions = (): ConditionsContextValue => {
    const context = useContext(ConditionsContext)

    if (!context) {
        throw new Error('useConditions must be used inside FilteringSection')
    }

    return context
}
