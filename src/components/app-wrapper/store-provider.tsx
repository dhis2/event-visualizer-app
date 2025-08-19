// eslint-disable-next-line no-restricted-imports
import { useDataEngine } from '@dhis2/app-service-data'
import { useState } from 'react'
import type { FC, ReactNode } from 'react'
import { Provider } from 'react-redux'
import { useAppCachedDataQuery } from './app-cached-data-query-provider'
import { useMetadataStore } from './metadata-provider'
import { createStore } from '@store/store'

export const StoreProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const engine = useDataEngine()
    const metadataStore = useMetadataStore()
    const appChachedData = useAppCachedDataQuery()
    const [store] = useState(() =>
        createStore(engine, metadataStore, appChachedData)
    )
    return <Provider store={store}>{children}</Provider>
}
