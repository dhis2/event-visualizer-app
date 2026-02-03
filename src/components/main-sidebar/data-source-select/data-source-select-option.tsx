import cx from 'classnames'
import { type KeyboardEvent, useCallback } from 'react'
import classes from './styles/data-source-select-option.module.css'
import { useAppSelector, useAppDispatch, useAddMetadata } from '@hooks'
import {
    isSelectedDataSourceId,
    setDataSourceId,
} from '@store/dimensions-selection-slice'
import type { MetadataItemWithName, ProgramMetadataItem } from '@types'

export type DataSourceSelectOptionProps = {
    option: ProgramMetadataItem | MetadataItemWithName
    closeDropdown: () => void
}

const getSiblingByDirection = (
    element: HTMLElement,
    direction: 'forward' | 'backward'
): HTMLElement | null => {
    return direction === 'forward'
        ? (element.nextElementSibling as HTMLElement)
        : (element.previousElementSibling as HTMLElement)
}

const focusSibling = (
    event: KeyboardEvent<HTMLLIElement>,
    direction: 'forward' | 'backward'
) => {
    event.preventDefault()

    let sibling = getSiblingByDirection(event.currentTarget, direction)

    while (sibling && sibling.tabIndex < 0) {
        sibling = getSiblingByDirection(sibling, direction)
    }

    if (sibling) {
        sibling.focus()
    }
}

export const DataSourceSelectOption = ({
    option,
    closeDropdown,
}: DataSourceSelectOptionProps) => {
    const dispatch = useAppDispatch()
    const addMetadata = useAddMetadata()
    const isSelected = useAppSelector((state) =>
        isSelectedDataSourceId(state, option.id)
    )
    const handleSelect = useCallback(() => {
        addMetadata(option)
        dispatch(setDataSourceId(option.id))
        closeDropdown()
    }, [addMetadata, dispatch, closeDropdown, option])

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLLIElement>) => {
            if (event.code === 'Enter' || event.code === 'Space') {
                event.preventDefault()
                handleSelect()
            }
            if (event.code === 'ArrowDown') {
                focusSibling(event, 'forward')
            }
            if (event.code === 'ArrowUp') {
                focusSibling(event, 'backward')
            }
        },
        [handleSelect]
    )

    return (
        <li
            role="option"
            aria-selected={isSelected}
            tabIndex={isSelected ? undefined : 0}
            className={cx(classes.option, {
                [classes.selected]: isSelected,
            })}
            onClick={isSelected ? undefined : handleSelect}
            onKeyDown={onKeyDown}
        >
            {isSelected && (
                <span aria-hidden={true} className={classes.checkmark} />
            )}
            {option.name}
        </li>
    )
}
