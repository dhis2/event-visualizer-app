import type {
    DimensionMetadataItem,
    MetadataItem,
    MetadataStore,
    Program,
    ProgramStage,
} from '@types'

type MetadataStoreStubData = {
    items?: Record<string, MetadataItem>
    dimensions?: Record<string, DimensionMetadataItem>
    programs?: Record<string, Program>
    programStages?: Record<string, ProgramStage>
}

/* The real store rejects anything that is not a complete metadata item, which
 * test fixtures deliberately are not. This stands in for it, and returns the
 * full MetadataStore type so that adding a getter to the store fails to
 * compile here until the stub implements it too. */
export const createMetadataStoreStub = ({
    items = {},
    dimensions = {},
    programs = {},
    programStages = {},
}: MetadataStoreStubData = {}): MetadataStore => {
    const orThrow = <T>(item: T | undefined, message: string): T => {
        if (!item) {
            throw new Error(message)
        }
        return item
    }
    return {
        getMetadataItem: (id) => items[id],
        getMetadataItems: (ids) =>
            ids.reduce<Record<string, MetadataItem>>((found, id) => {
                const item = items[id]
                if (item) {
                    found[id] = item
                }
                return found
            }, {}),
        getProgramMetadataItem: (id) => programs[id],
        getProgramStageMetadataItem: (id) => programStages[id],
        getOptionSetMetadataItem: () => undefined,
        getLegendSetMetadataItem: () => undefined,
        getOrganisationUnitMetadataItem: () => undefined,
        getUserOrgUnitMetadataItem: () => undefined,
        getDimensionMetadataItem: (id) => dimensions[id],
        getMetadataItemOrThrow: (id) =>
            orThrow(items[id], `No metadata item found for id "${id}"`),
        getProgramMetadataItemOrThrow: (id) =>
            orThrow(programs[id], `No program found for id "${id}"`),
        getProgramStageMetadataItemOrThrow: (id) =>
            orThrow(programStages[id], `No program stage found for id "${id}"`),
        getDimensionMetadataItemOrThrow: (id) =>
            orThrow(dimensions[id], `No dimension found for id "${id}"`),
        addMetadata: () => undefined,
        setVisualizationMetadata: () => undefined,
    }
}
