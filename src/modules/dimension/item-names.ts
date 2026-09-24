import { ouIdHelper } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { extractPlainDimensionId } from '@modules/dimension/ids'
import { isStartEndDate } from '@modules/utils/dates'
import type { MetadataItem } from '@types'

type ItemMetadataItems = Record<string, MetadataItem | undefined>

export const getItemMetadataIds = (itemIds: string[]): string[] => {
    const ids = new Set<string>()

    for (const id of itemIds) {
        ids.add(
            ouIdHelper.hasLevelPrefix(id) || ouIdHelper.hasGroupPrefix(id)
                ? ouIdHelper.removePrefix(id)
                : extractPlainDimensionId(id)
        )
    }

    return Array.from(ids)
}

const getNameList = (
    ids: string[],
    label: string,
    metadataItems: ItemMetadataItems
): string =>
    `${label}: ${ids.map((id) => metadataItems[id]?.name ?? id).join(', ')}`

/* Org unit levels and groups are collapsed into one "Levels: a, b" entry each,
 * rather than listed alongside the individually selected org units. */
export const getItemDisplayNames = ({
    itemIds,
    metadataItems,
    formatStartEndDate,
}: {
    itemIds: string[]
    metadataItems: ItemMetadataItems
    formatStartEndDate: (startEndDate: string) => string
}): string[] => {
    const levelIds: string[] = []
    const groupIds: string[] = []
    const displayNames: string[] = []

    for (const id of itemIds) {
        if (ouIdHelper.hasLevelPrefix(id)) {
            levelIds.push(ouIdHelper.removePrefix(id))
        } else if (ouIdHelper.hasGroupPrefix(id)) {
            groupIds.push(ouIdHelper.removePrefix(id))
        } else {
            const plainId = extractPlainDimensionId(id)
            displayNames.push(
                isStartEndDate(plainId)
                    ? formatStartEndDate(plainId)
                    : (metadataItems[plainId]?.name ?? id)
            )
        }
    }

    if (levelIds.length > 0) {
        displayNames.push(
            getNameList(levelIds, i18n.t('Levels'), metadataItems)
        )
    }
    if (groupIds.length > 0) {
        displayNames.push(
            getNameList(groupIds, i18n.t('Groups'), metadataItems)
        )
    }

    return displayNames
}
