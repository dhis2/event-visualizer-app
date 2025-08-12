import type { FC, ReactNode } from 'react'
import { AppCachedDataQueryProvider } from './app-cached-data-query-provider'
import { MetadataProvider } from './metadata-provider'
import { StoreProvider } from './store-provider'
import { StoreToLocationSyncer } from './store-to-location-syncer'

export const AppWrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <AppCachedDataQueryProvider>
        <MetadataProvider>
            <StoreProvider>
                <StoreToLocationSyncer />
                {children}
            </StoreProvider>
        </MetadataProvider>
    </AppCachedDataQueryProvider>
)
