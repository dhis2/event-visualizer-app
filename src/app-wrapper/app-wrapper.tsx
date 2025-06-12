import { useDataEngine } from '@dhis2/app-service-data'
import React, { FC, ReactNode, useState } from 'react'
import { Provider } from 'react-redux'
import { createStore } from '../store'

export const AppWrapper: FC<{ children: ReactNode }> = ({ children }) => {
    const engine = useDataEngine()
    const [store] = useState(() => createStore(engine))
    return <Provider store={store}>{children}</Provider>
}
