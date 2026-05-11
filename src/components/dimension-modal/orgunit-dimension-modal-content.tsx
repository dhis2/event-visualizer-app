import { OrgUnitDimension, ouIdHelper } from '@dhis2/analytics'
import {
    useAddMetadata,
    useAppDispatch,
    useAppSelector,
    useCurrentUser,
    useMetadataItems,
    useRootOrgUnits,
} from '@hooks'
import {
    getVisUiConfigPlainItemIdsByDimension,
    getVisUiConfigOutputType,
    setVisUiConfigItemsByDimension,
} from '@store/vis-ui-config-slice.js'
import type {
    DimensionMetadataItem,
    OrgUnit,
    OrganisationUnitMetadataItem,
} from '@types'
import { useCallback, useMemo, type FC } from 'react'

type OrgUnitDimensionModalContentProps = {
    dimension: DimensionMetadataItem
}

export const OrgUnitDimensionModalContent: FC<
    OrgUnitDimensionModalContentProps
> = ({ dimension }) => {
    const dispatch = useAppDispatch()
    const addMetadata = useAddMetadata()

    const currentUser = useCurrentUser()
    const rootOrgUnits = useRootOrgUnits()
    const outputType = useAppSelector(getVisUiConfigOutputType)

    const orgUnitTreeRoots = useMemo(
        () => rootOrgUnits.map((rootOrgUnit) => rootOrgUnit.id),
        [rootOrgUnits]
    )

    const updateOrgUnitDimensionItems = useCallback(
        ({ items }) => {
            const itemPrefix =
                outputType === 'TRACKED_ENTITY_INSTANCE' && dimension.programId
                    ? `${dimension.programId}.`
                    : ''

            const { uiItems, metadata } = items.reduce(
                (acc, item) => {
                    acc.uiItems.push(`${itemPrefix}${item.id}`)

                    const ouUid = ouIdHelper.removePrefix(item.id)

                    const ouMetadata = {
                        id: ouUid,
                        name: item.name,
                    }

                    if (item.path) {
                        ouMetadata['path'] = item.path
                    }

                    acc.metadata[ouUid] = ouMetadata

                    return acc
                },
                { uiItems: [], metadata: {} }
            )

            addMetadata(metadata)

            dispatch(
                setVisUiConfigItemsByDimension({
                    dimensionId: dimension.id,
                    itemIds: uiItems,
                })
            )
        },
        [addMetadata, dispatch, dimension.id, dimension.programId, outputType]
    )

    const selectedIds = useAppSelector((state) =>
        getVisUiConfigPlainItemIdsByDimension(state, dimension?.id)
    )

    const selectedIdsMetadata = useMetadataItems(
        selectedIds.map(ouIdHelper.removePrefix)
    )

    const selected = useMemo(
        () =>
            selectedIds.reduce((acc, id) => {
                const ouUid = ouIdHelper.removePrefix(id)

                const metadata = selectedIdsMetadata[
                    ouUid
                ] as OrganisationUnitMetadataItem

                if (metadata) {
                    acc.push({
                        id,
                        name: metadata?.name,
                        path: metadata?.path,
                    })
                }

                return acc
            }, [] as OrgUnit[]),
        [selectedIds, selectedIdsMetadata]
    )

    return (
        <OrgUnitDimension
            selected={selected}
            roots={orgUnitTreeRoots}
            displayNameProp={currentUser.settings['displayNameProperty']}
            onSelect={updateOrgUnitDimensionItems}
        />
    )
}
