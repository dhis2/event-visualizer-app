import i18n from '@dhis2/d2-i18n'
import { Checkbox } from '@dhis2/ui'
import { type FC, useCallback, useMemo } from 'react'
import classes from './styles/status-dimension-modal-content.module.css'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getDimensionIdParts } from '@modules/dimension'
import { getStatusNames } from '@modules/status'
import {
    getVisUiConfigItemsByDimension,
    setVisUiConfigItemsByDimension,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'

type StatusDimensionModalContentProps = {
    dimension: DimensionMetadataItem
}

export const StatusDimensionModalContent: FC<
    StatusDimensionModalContentProps
> = ({ dimension }) => {
    const dispatch = useAppDispatch()

    const dataTest = useMemo(
        () =>
            dimension.id === 'PROGRAM_STATUS'
                ? 'program-status-checkbox'
                : 'event-status-checkbox',
        [dimension.id]
    )
    const statusNames = getStatusNames()

    const selectedIds = useAppSelector((state) =>
        getVisUiConfigItemsByDimension(state, dimension?.id).map(
            (id) => getDimensionIdParts({ id }).dimensionId
        )
    )

    const statuses = useMemo(() => {
        // XXX: for programStatus the id should be prefixed with program/stage
        const statusList = [
            { id: 'ACTIVE', name: statusNames['ACTIVE'] },
            { id: 'COMPLETED', name: statusNames['COMPLETED'] },
        ]

        if (dimension.id === 'programStatus') {
            statusList.push({
                id: 'CANCELLED',
                name: statusNames['CANCELLED'],
            })
        } else if (dimension.id === 'eventStatus') {
            statusList.push({
                id: 'SCHEDULE',
                name: statusNames['SCHEDULE'],
            })
        }

        return statusList
    }, [dimension.id, statusNames])

    const updateStatusDimensionItems = useCallback(
        ({ selectedIds, itemId, checked }) => {
            const uiItems = checked
                ? [...new Set([...selectedIds, itemId])]
                : selectedIds.filter((id) => id !== itemId)

            dispatch(
                setVisUiConfigItemsByDimension({
                    dimensionId: dimension.id,
                    itemIds: uiItems,
                })
            )
        },
        [dispatch, dimension.id]
    )

    return (
        <>
            <p className={classes.paragraph}>
                {i18n.t('Show items where the status is:', {
                    nsSeparator: '^^',
                })}
            </p>
            <div>
                {statuses.map(({ id, name }) => (
                    <Checkbox
                        key={id}
                        checked={selectedIds.includes(id)}
                        label={name}
                        onChange={({ checked }) =>
                            updateStatusDimensionItems({
                                selectedIds,
                                itemId: id,
                                checked,
                            })
                        }
                        dense
                        className={classes.verticalCheckbox}
                        dataTest={dataTest}
                    />
                ))}
            </div>
        </>
    )
}
