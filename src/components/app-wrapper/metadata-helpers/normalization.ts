import {
    isMetadataItem,
    isSimpleMetadataItem,
    isProgramMetadataItem,
    isProgramStageMetadataItem,
    isOptionSetMetadataItem,
    isOrganisationUnitMetadataItem,
    isLegendSetMetadataItem,
    isUserOrgUnitMetadataInputItem,
    isUserOrgUnitMetadataItem,
} from './type-guards'
import type {
    AnyMetadataItemInput,
    SimpleMetadataItem,
    MetadataStoreItem,
    NormalizedMetadataItem,
    UserOrgUnitMetadataInputItem,
    UserOrgUnitMetadataItem,
} from './types'
import type { MetadataItem } from '@types'

// Normalization helper functions for each input type
export const normalizeMetadataItem = (
    input: MetadataItem
): NormalizedMetadataItem => {
    const { uid, ...rest } = input
    const result: NormalizedMetadataItem = {
        id: uid, // Convert uid to id
        ...rest,
    }
    return result
}

export const normalizeSimpleMetadataItem = (
    input: SimpleMetadataItem
): NormalizedMetadataItem => {
    // Get the single key-value pair from the simple metadata item
    const [key, value] = Object.entries(input)[0]
    const result: NormalizedMetadataItem = {
        id: key,
        name: value,
    }
    return result
}

const normalizeUserOrgUnitMetadata = (
    input: UserOrgUnitMetadataInputItem,
    metadata: Map<string, MetadataStoreItem>
): UserOrgUnitMetadataItem => {
    const userOrgUnitMetadata = metadata.get(
        'USER_ORGUNIT'
    ) as UserOrgUnitMetadataItem
    if (!userOrgUnitMetadata) {
        throw new Error('USER_ORGUNIT not found in metadata map')
    }
    return {
        ...userOrgUnitMetadata,
        organisationUnits: input.organisationUnits,
    }
}

export const normalizeMetadataInputItem = (
    input: AnyMetadataItemInput,
    metadata: Map<string, MetadataStoreItem>
): MetadataStoreItem => {
    if (isMetadataItem(input)) {
        return normalizeMetadataItem(input)
    } else if (isSimpleMetadataItem(input)) {
        return normalizeSimpleMetadataItem(input)
    } else if (isUserOrgUnitMetadataInputItem(input)) {
        return normalizeUserOrgUnitMetadata(input, metadata)
    } else if (
        isProgramMetadataItem(input) ||
        isProgramStageMetadataItem(input) ||
        isOptionSetMetadataItem(input) ||
        isLegendSetMetadataItem(input) ||
        isOrganisationUnitMetadataItem(input) ||
        isUserOrgUnitMetadataItem(input)
    ) {
        return input as MetadataStoreItem
    } else {
        throw new Error('Unknown metadata input type')
    }
}
