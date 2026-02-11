import { useCallback, useMemo, type FC } from 'react'
import { OrgUnitDimension, ouIdHelper } from '@dhis2/analytics'
//import { removeLastPathSegment } from '../../../modules/orgUnit.js'
import {
    useAddMetadata,
    useCurrentUser,
    useMetadataItems,
    useRootOrgUnits,
} from '@hooks'
import { OPERATOR_IN } from '@modules/conditions'
import type { OrganisationUnitMetadataItem, OrgUnit } from '@types'

type OrgUnitConditionProps = {
    condition: string
    onChange: (value: string) => void
}

export const OrgUnitCondition: FC<OrgUnitConditionProps> = ({
    condition,
    onChange,
}) => {
    const currentUser = useCurrentUser()
    const rootOrgUnits = useRootOrgUnits()
    const addMetadata = useAddMetadata()

    const selectedIds = useMemo(() => {
        const ouUidsString = condition.split(':')?.[1] ?? ''

        if (ouUidsString.length === 0) {
            return []
        }

        return ouUidsString.split(';')
    }, [condition])

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

    const onSelect = useCallback(
        ({ items }) => {
            if (items.length === 0) {
                onChange('')
            } else {
                const { itemIds, metadata } = items.reduce(
                    (acc, item) => {
                        acc.itemIds.push(item.id)

                        const ouUid = ouIdHelper.removePrefix(item.id)

                        const ouMetadata = {
                            id: ouUid,
                            name: item.name || item.displayName, // XXX: is this needed?
                        }

                        if (item.path) {
                            ouMetadata['path'] = item.path
                        }

                        // XXX: check if this processing of path is needed for metadata
                        //    if (item.path) {
                        //        const path = removeLastPathSegment(item.path)

                        //        acc.forParentGraphMap[item.id] =
                        //            path === `/${item.id}`
                        //                ? ''
                        //                : path.replace(/^\//, '')
                        //    }

                        return acc
                    },
                    { itemIds: [], metadata: {} }
                )
                addMetadata(metadata)

                onChange(`${OPERATOR_IN}:${itemIds.join(';')}`)
            }
        },
        [addMetadata, onChange]
    )

    const roots = rootOrgUnits.map((rootOrgUnit) => rootOrgUnit.id)

    return (
        <OrgUnitDimension
            selected={selected}
            roots={roots}
            displayNameProp={currentUser.settings.displayNameProperty}
            onSelect={onSelect}
        />
    )
}
