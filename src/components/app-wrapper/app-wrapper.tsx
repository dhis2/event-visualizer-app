import { DimensionDialogAnchorProvider } from '@components/dimension-dialog/anchor-context'
import type { FC, ReactNode } from 'react'
import { AppCachedDataQueryProvider } from './app-cached-data-query-provider'
import { DndContextProvider } from './drag-and-drop-provider/dnd-context-provider'
import { InterpretationsProvider } from './interpretations-provider'
import { MetadataProvider } from './metadata-provider/metadata-provider'
import { StoreProvider } from './store-provider'
import { StoreToLocationSyncer } from './store-to-location-syncer'
import { useUncaughtErrorAlert } from './use-uncaught-error-alert'
// eslint-disable-next-line no-restricted-imports
import '../../locales/index.js'

export const AppWrapper: FC<{ children: ReactNode }> = ({ children }) => {
    useUncaughtErrorAlert()

    return (
        <AppCachedDataQueryProvider>
            <MetadataProvider>
                <StoreProvider>
                    <StoreToLocationSyncer />
                    <DndContextProvider>
                        <InterpretationsProvider>
                            <DimensionDialogAnchorProvider>
                                {children}
                            </DimensionDialogAnchorProvider>
                        </InterpretationsProvider>
                    </DndContextProvider>
                </StoreProvider>
            </MetadataProvider>
        </AppCachedDataQueryProvider>
    )
}
