import { ShowAllFilterRadio } from '@components/dimension-modal/show-all-filter-radio/show-all-filter-radio'
import { useItemsFilterRadioMode } from '@components/dimension-modal/show-all-filter-radio/use-items-filter-radio-mode'
import { Checkbox } from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getStatusNames } from '@modules/status'
import {
    getVisUiConfigPlainItemIdsByDimension,
    setVisUiConfigItemsByDimension,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { type FC, useCallback, useMemo } from 'react'
import classes from './styles/status-dimension-modal-content.module.css'

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
        getVisUiConfigPlainItemIdsByDimension(state, dimension?.id)
    )

    const { mode, onModeChange } = useItemsFilterRadioMode(dimension)

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
        ({
            selectedIds,
            itemId,
            checked,
        }: {
            selectedIds: string[]
            itemId: string
            checked: boolean
        }) => {
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
        <ShowAllFilterRadio
            mode={mode}
            onModeChange={onModeChange}
            dataTest={`${dataTest}-filter-radio`}
        >
            <div className={classes.checkboxContainer}>
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
                        dataTest={dataTest}
                    />
                ))}
            </div>
        </ShowAllFilterRadio>
    )
}
