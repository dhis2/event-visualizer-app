import i18n from '@dhis2/d2-i18n'
import {
    IconCross16,
    IconFilter16,
    Layer,
    FlyoutMenu,
    MenuItem,
    Popper,
    type MenuItemProps,
} from '@dhis2/ui'
import cx from 'classnames'
import { useCallback, useMemo, useRef, useState, type FC } from 'react'
import classes from './styles/filter-dropdown-button.module.css'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    clearFilter,
    getFilter,
    setFilter,
} from '@store/dimensions-selection-slice'

type MenuItemClickHandler = NonNullable<MenuItemProps['onClick']>

export const FilterDropdownButton: FC = () => {
    const filters = useMemo(
        () => ({
            ORG_UNITS: i18n.t('Org units'),
            PERIODS: i18n.t('Periods'),
            STATUSES: i18n.t('Statuses'),
            DATA_ELEMENTS: i18n.t('Data elements'),
            PROGRAM_ATTRIBUTES: i18n.t('Program attributes'),
            PROGRAM_INDICATORS: i18n.t('Program indicators'),
            CATEGORIES: i18n.t('Categories'),
            CATEGORY_OPTION_GROUP_SETS: i18n.t('Category option group sets'),
        }),
        []
    )
    const buttonWrapRef = useRef<HTMLDivElement | null>(null)
    const dispatch = useAppDispatch()
    const activeFilter = useAppSelector(getFilter)
    const activeFilterLabel = useMemo(
        () => (activeFilter ? filters[activeFilter] : undefined),
        [filters, activeFilter]
    )
    const [isOpen, setIsOpen] = useState(false)
    const toggleIsOpen = useCallback(() => {
        setIsOpen((curr) => !curr)
    }, [])
    const setActiveFilter = useCallback<MenuItemClickHandler>(
        ({ value }, event) => {
            event.stopPropagation()
            if (!value) {
                throw new Error('No value set on menu item')
            }
            dispatch(setFilter(value))
            toggleIsOpen()
        },
        [dispatch, toggleIsOpen]
    )
    const clearActiveFilter = useCallback(() => {
        dispatch(clearFilter())
    }, [dispatch])

    return (
        <>
            <div
                className={classes.buttonWrap}
                data-test="filter-dropdown-button-wrap"
                ref={buttonWrapRef}
            >
                <IconFilter16 />
                <button
                    className={cx(classes.filterButton, {
                        [classes.withSelection]: activeFilter,
                    })}
                    data-test="filter-dropdown-button"
                    onClick={toggleIsOpen}
                >
                    {activeFilterLabel ?? i18n.t('Filter')}
                </button>
                {activeFilter && (
                    <button
                        className={classes.filterClearButton}
                        data-test="filter-clear-button"
                        onClick={clearActiveFilter}
                    >
                        <IconCross16 />
                    </button>
                )}
            </div>
            {isOpen && (
                <Layer onBackdropClick={toggleIsOpen}>
                    <Popper reference={buttonWrapRef} placement="bottom-end">
                        <FlyoutMenu dense>
                            {Object.entries(filters).map(([key, label]) => (
                                <MenuItem
                                    label={label}
                                    value={key}
                                    key={key}
                                    onClick={setActiveFilter}
                                    dataTest={`filter-menu-item-${key}`}
                                    active={key === activeFilter}
                                />
                            ))}
                        </FlyoutMenu>
                    </Popper>
                </Layer>
            )}
        </>
    )
}
