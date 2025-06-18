import React, { FC, ReactNode } from 'react'
import { AppCachedDataQueryProvider } from './app-cached-data-query-provider'
import { MetadataProvider } from './metadata-provider'
import { StoreProvider } from './store-provider'

export const AppWrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <AppCachedDataQueryProvider>
        <MetadataProvider>
            <StoreProvider>{children}</StoreProvider>
        </MetadataProvider>
    </AppCachedDataQueryProvider>
)
