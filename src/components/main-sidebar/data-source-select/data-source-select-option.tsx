import cx from 'classnames'
import React, { useCallback } from 'react'
import classes from './styles/data-source-select-option.module.css'
import { useAppSelector, useAppDispatch, useAddMetadata } from '@hooks'
import {
    getIsSelectedDataSourceId,
    setDataSourceId,
} from '@store/dimensions-selection-slice'
import type { MetadataItemWithName, ProgramMetadataItem } from '@types'

export type DataSourceSelectOptionProps = {
    option: ProgramMetadataItem | MetadataItemWithName
    closeDropdown: () => void
}

export const DataSourceSelectOption = ({
    option,
    closeDropdown,
}: DataSourceSelectOptionProps) => {
    const dispatch = useAppDispatch()
    const addMetadata = useAddMetadata()
    const isSelected = useAppSelector((state) =>
        getIsSelectedDataSourceId(state, option.id)
    )
    const handleSelect = useCallback(() => {
        addMetadata(option)
        dispatch(setDataSourceId(option.id))
        closeDropdown()
    }, [addMetadata, dispatch, closeDropdown, option])

    console.log('isSelected', isSelected, option.name)

    return (
        <li
            role="option"
            aria-selected={isSelected}
            tabIndex={-1}
            className={cx(classes.option, {
                [classes.selected]: isSelected,
            })}
            onClick={isSelected ? undefined : handleSelect}
        >
            {isSelected && (
                <span aria-hidden={true} className={classes.checkmark} />
            )}
            {option.name}
        </li>
    )
}
