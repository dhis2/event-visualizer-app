// Main hook - primary export
export { useDimensionList } from './use-dimension-list'
export type {
    UseDimensionListOptions,
    UseDimensionListResult,
} from './use-dimension-list'

// Types needed by consumers
export type { Transformer } from './default-transformer'

// Helper function used externally (card-event.tsx)
export { computeIsDisabledByFilter } from './filter-helpers'

// Internal exports for testing only - not part of public API
// Tests import from '..' so they need these exports
export { defaultTransformer } from './default-transformer'
export { buildQuery, getFilterParamsFromBaseQuery } from './query-helpers'
export { filterDimensions, isFetchEnabledByFilter } from './filter-helpers'
