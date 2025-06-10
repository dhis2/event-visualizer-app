import { useDataEngine } from '@dhis2/app-service-data'
import { useEffect } from 'react'
import { createDataEngineMiddleware } from '../middleware/data-engine-middleware'
import { dynamicMiddleware } from '../middleware/dynamic'

export const DataEngineProviderBridge = () => {
    const engine = useDataEngine()

    useEffect(() => {
        const getEngine = () => engine
        const middleware = createDataEngineMiddleware(getEngine)
        dynamicMiddleware.addMiddleware(middleware)
    }, [engine])

    return null
}
