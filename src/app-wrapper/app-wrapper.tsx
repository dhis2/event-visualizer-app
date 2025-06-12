import { useDataEngine } from '@dhis2/app-service-data'
import React, { FC, ReactNode, useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { createDataEngineMiddleware } from '../middleware/data-engine-middleware'
import { dynamicMiddleware } from '../middleware/dynamic'
import { store } from '../store'
import type { DataEngine } from '../types/data-engine'

const DataEngineProviderBridge: FC = () => {
    const engine = useDataEngine()
    const engineRef = useRef<DataEngine>(engine)

    useEffect(() => {
        console.log('BRIDGE::addMiddleware', engineRef.current)
        const middleware = createDataEngineMiddleware(() => engineRef.current)
        dynamicMiddleware.addMiddleware(middleware)
    }, [])

    console.log('BRIDGE::render')

    return null
}

export const AppWrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <Provider store={store}>
        <DataEngineProviderBridge />
        {children}
    </Provider>
)
