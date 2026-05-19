import i18n from '@dhis2/d2-i18n'
import { Checkbox, IconDimensionData16 } from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import { getStatusNames } from '@modules/status'
import {
    getVisUiConfigPlainItemIdsByDimension,
    setVisUiConfigItemsByDimension,
} from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { type FC, useCallback, useMemo, useState } from 'react'
import { ConditionsSection } from './conditions-modal-content/conditions-section'
import {
    DataSectionToggle,
    type DataSectionToggleMode,
} from './conditions-modal-content/data-section-toggle'
import conditionsClasses from './conditions-modal-content/styles/conditions-modal-content.module.css'
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

    const [mode, setModeState] = useState<DataSectionToggleMode>(() =>
        selectedIds.length > 0 ? 'filter' : 'all'
    )
    const [draftSelectedIds, setDraftSelectedIds] = useState<string[]>([])

    const persistItems = useCallback(
        (itemIds: string[]) => {
            dispatch(
                setVisUiConfigItemsByDimension({
                    dimensionId: dimension.id,
                    itemIds,
                })
            )
        },
        [dispatch, dimension.id]
    )

    const setMode = useCallback(
        (next: DataSectionToggleMode) => {
            if (next === mode) {
                return
            }
            setModeState(next)
            if (next === 'all') {
                if (selectedIds.length > 0) {
                    setDraftSelectedIds(selectedIds)
                    persistItems([])
                }
                return
            }
            if (selectedIds.length === 0 && draftSelectedIds.length > 0) {
                persistItems(draftSelectedIds)
                setDraftSelectedIds([])
            }
        },
        [mode, selectedIds, draftSelectedIds, persistItems]
    )

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

            persistItems(uiItems)
        },
        [persistItems]
    )

    return (
        <div className={conditionsClasses.sectionStack}>
            <ConditionsSection
                title={i18n.t('Data')}
                titleIcon={<IconDimensionData16 />}
                dataTest="dimension-popover-data-section"
            >
                <div className={conditionsClasses.dataSectionStack}>
                    <DataSectionToggle
                        mode={mode}
                        onChange={setMode}
                        dataTest="dimension-popover-data-toggle"
                    />
                    {mode === 'filter' && (
                        <div className={conditionsClasses.mainSection}>
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
                    )}
                </div>
            </ConditionsSection>
        </div>
    )
}
