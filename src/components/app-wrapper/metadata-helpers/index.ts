// Export types used by metadata-provider
export type {
    AnyMetadataItemInput,
    MetadataStoreItem,
    MetadataInput,
    Subscriber,
    AnalyticsMetadataInput,
    UserOrgUnitMetadataItem,
} from './types'

// Export utility functions used by metadata-provider
export {
    isObject,
    isSingleMetadataItemInput,
    isLegendSetMetadataItem,
    isUserOrgUnitMetadataItem,
} from './type-guards'
export { normalizeMetadataInputItem } from './normalization'
export { smartMergeWithChangeDetection } from './merge-utils'
export { getInitialMetadata } from './initial-metadata'
