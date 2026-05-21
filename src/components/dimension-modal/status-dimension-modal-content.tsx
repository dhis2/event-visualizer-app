import i18n from '@dhis2/d2-i18n'
import { Checkbox, Radio } from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getStatusNames } from '@modules/status'
import { getUiDimensionDialogMode } from '@store/ui-slice'
import {
    getVisUiConfigPlainItemIdsByDimension,
    setVisUiConfigItemsByDimension,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { type FC, useCallback, useMemo, useState } from 'react'
import classes from './styles/status-dimension-modal-content.module.css'

const FILTER_MODE_ALL = 'all'
const FILTER_MODE_FILTER = 'filter'
type FilterMode = typeof FILTER_MODE_ALL | typeof FILTER_MODE_FILTER

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

    const [stashedIds, setStashedIds] = useState<string[]>(selectedIds)

    const [mode, setMode] = useState<FilterMode>(() =>
        selectedIds.length ? FILTER_MODE_FILTER : FILTER_MODE_ALL
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

            setStashedIds(uiItems)

            dispatch(
                setVisUiConfigItemsByDimension({
                    dimensionId: dimension.id,
                    itemIds: uiItems,
                })
            )
        },
        [dispatch, dimension.id]
    )

    const onModeChange = useCallback(
        (newMode: FilterMode) => {
            if (newMode === FILTER_MODE_ALL) {
                setStashedIds(selectedIds)
                dispatch(
                    setVisUiConfigItemsByDimension({
                        dimensionId: dimension.id,
                        itemIds: [],
                    })
                )
            } else {
                dispatch(
                    setVisUiConfigItemsByDimension({
                        dimensionId: dimension.id,
                        itemIds: stashedIds,
                    })
                )
            }
            setMode(newMode)
        },
        [dispatch, dimension.id, selectedIds, stashedIds]
    )

    const radioName = `status-mode-${dimension.id}`

    const isModal = useAppSelector(getUiDimensionDialogMode) === 'modal'

    return (
        <div
            className={`${classes.modeRadios} ${
                isModal ? classes.modalPadded : ''
            }`}
        >
            <div
                className={`${classes.modeCard} ${
                    mode === FILTER_MODE_ALL ? classes.modeCardActive : ''
                }`}
            >
                <Radio
                    name={radioName}
                    label={i18n.t('Show all values')}
                    value={FILTER_MODE_ALL}
                    checked={mode === FILTER_MODE_ALL}
                    onChange={({ value }) => onModeChange(value as FilterMode)}
                    dense
                    dataTest="status-mode-all"
                />
            </div>
            <div
                className={`${classes.modeCard} ${
                    mode === FILTER_MODE_FILTER ? classes.modeCardActive : ''
                }`}
            >
                <Radio
                    name={radioName}
                    label={i18n.t('Filter by...')}
                    value={FILTER_MODE_FILTER}
                    checked={mode === FILTER_MODE_FILTER}
                    onChange={({ value }) => onModeChange(value as FilterMode)}
                    dense
                    dataTest="status-mode-filter"
                />
                <div className={classes.filterBodyWrap}>
                    <div className={classes.filterBodyInner}>
                        <div className={classes.filterBody}>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
