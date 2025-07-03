// eslint-disable-next-line no-restricted-imports
import { useDataEngine } from '@dhis2/app-service-data'
import React, { FC, ReactNode, useState } from 'react'
import { Provider } from 'react-redux'
import { createStore } from '../store'
import { useAppCachedDataQuery } from './app-cached-data-query-provider'
import { useMetadataStore } from './metadata-provider'

export const StoreProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const engine = useDataEngine()
    const metadataStore = useMetadataStore()
    const appChachedData = useAppCachedDataQuery()
    const [store] = useState(() =>
        createStore(engine, metadataStore, appChachedData)
    )
    console.log(engine, metadataStore, appChachedData)
    return <Provider store={store}>{children}</Provider>
}
