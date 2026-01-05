import { useCallback, useMemo, type FC } from 'react'
import { OrgUnitDimension, ouIdHelper } from '@dhis2/analytics'
import {
    useAddMetadata,
    useAppDispatch,
    useAppSelector,
    useCurrentUser,
    useMetadataItems,
    useRootOrgUnits,
} from '@hooks'
import { getDimensionIdParts, getFullDimensionId } from '@modules/dimension'
import {
    getVisUiConfigItemsByDimension,
    getVisUiConfigOutputType,
    setVisUiConfigItemsByDimension,
} from '@store/vis-ui-config-slice.js'
import type {
    InternalDimensionRecord,
    OrgUnit,
    OrganisationUnitMetadataItem,
} from '@types'

type OrgUnitDimensionModalContentProps = {
    dimension: InternalDimensionRecord
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
            const { programId } = getDimensionIdParts({
                id: dimension.id,
                outputType,
            })

            const { uiItems, metadata } = items.reduce(
                (acc, item) => {
                    const id = getFullDimensionId({
                        dimensionId: item.id,
                        programId,
                        outputType,
                    })
                    acc.uiItems.push(id)

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
        [addMetadata, dispatch, dimension.id, outputType]
    )

    const selectedIds = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension?.id).map(
            (id) => getDimensionIdParts({ id }).dimensionId
        )
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
