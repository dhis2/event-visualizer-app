import type { FC, ReactNode } from 'react'
import { AppCachedDataQueryProvider } from './app-cached-data-query-provider'
import { DndContextProvider } from './drag-and-drop-provider/dnd-context-provider'
import { InterpretationsProvider } from './interpretations-provider'
import { MetadataProvider } from './metadata-provider/metadata-provider'
import { StoreProvider } from './store-provider'
import { StoreToLocationSyncer } from './store-to-location-syncer'
import { UncaughtErrorBoundary } from './uncaught-error-boundary'
// eslint-disable-next-line no-restricted-imports
import '../../locales/index.js'

export const AppWrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <UncaughtErrorBoundary>
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
    </UncaughtErrorBoundary>
)
