import cx from 'classnames'
import React, { useCallback } from 'react'
import classes from './styles/data-source-select-option.module.css'
import type { DataSource } from './use-data-source-options'
import { useAppSelector, useAppDispatch } from '@hooks'
import {
    getIsSelectedDataSourceId,
    setDataSourceId,
} from '@store/dimensions-selection-slice'

export type DataSourceSelectOptionProps = {
    option: DataSource
    closeDropdown: () => void
}

export const DataSourceSelectOption = ({
    option,
    closeDropdown,
}: DataSourceSelectOptionProps) => {
    const dispatch = useAppDispatch()
    const isSelected = useAppSelector((state) =>
        getIsSelectedDataSourceId(state, option.id)
    )

    const handleSelect = useCallback(() => {
        dispatch(setDataSourceId(option.id))
        closeDropdown()
    }, [dispatch, closeDropdown, option])

    return (
        <li
            role="option"
            aria-selected={isSelected}
            tabIndex={-1}
            className={cx(classes.option, isSelected && classes.optionActive)}
            onClick={handleSelect}
        >
            {option.name}
        </li>
    )
}
