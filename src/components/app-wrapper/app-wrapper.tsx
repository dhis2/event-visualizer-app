import type { FC, ReactNode } from 'react'
import { AppCachedDataQueryProvider } from './app-cached-data-query-provider'
import { DndContextProvider } from './drag-and-drop-provider/dnd-context-provider'
import { InterpretationsProvider } from './interpretations-provider'
import { MetadataProvider } from './metadata-provider/metadata-provider'
import { StoreProvider } from './store-provider'
import { StoreToLocationSyncer } from './store-to-location-syncer'

export const AppWrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <AppCachedDataQueryProvider>
        <MetadataProvider>
            <StoreProvider>
                <StoreToLocationSyncer />
                <DndContextProvider>
                    <InterpretationsProvider>
                        {children}
                    </InterpretationsProvider>
                </DndContextProvider>
            </StoreProvider>
        </MetadataProvider>
    </AppCachedDataQueryProvider>
)
